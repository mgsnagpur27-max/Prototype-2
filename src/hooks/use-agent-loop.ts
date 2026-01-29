import { useCallback } from 'react';
import { useAgentStore } from '@/lib/stores/agent-store';
import { useFileTreeStore } from '@/lib/stores/file-tree-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useChatStore } from '@/lib/stores/chat-store';
import type { AgentAnalysis, AgentPlan, AgentStep, AgentFileChange, FileNode } from '@/types';

function parseJsonFromStream(content: string): Record<string, unknown> | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    return null;
  }
  return null;
}

async function streamRequest(
  endpoint: string,
  body: Record<string, unknown>,
  onChunk: (content: string) => void
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            fullContent += parsed.content;
            onChunk(parsed.content);
          }
          if (parsed.fullContent) {
            fullContent = parsed.fullContent;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  return fullContent;
}

function flattenFileTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  function traverse(node: FileNode) {
    result.push(node);
    node.children?.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}

export function useAgentLoop() {
  const agentStore = useAgentStore();
  const fileTreeStore = useFileTreeStore();
  const editorStore = useEditorStore();
  const chatStore = useChatStore();

  const getContext = useCallback(() => {
    return {
      fileStructure: fileTreeStore.rootNodes,
      openFiles: editorStore.openTabs.map((t) => t.filePath),
      cursorPosition: editorStore.cursorPosition,
      recentMessages: chatStore.getRecentMessages(5),
      consoleErrors: [],
    };
  }, [fileTreeStore.rootNodes, editorStore.openTabs, editorStore.cursorPosition, chatStore]);

  const analyzeRequest = useCallback(
    async (userRequest: string): Promise<AgentAnalysis | null> => {
      agentStore.setState('ANALYZING');
      agentStore.addLog(`Analyzing request: "${userRequest}"`, 'step');

      try {
        const context = getContext();
        let analysisContent = '';

        await streamRequest(
            '/api/ai/agent',
            { phase: 'analyze', userRequest, context },
            () => {}
          ).then((content) => {
            analysisContent = content;
          });

        const parsed = parseJsonFromStream(analysisContent);
        if (!parsed) {
          throw new Error('Failed to parse analysis response');
        }

        const analysis: AgentAnalysis = {
          intent: (parsed.intent as string) || '',
          affectedFiles: (parsed.affectedFiles as string[]) || [],
          dependencies: (parsed.dependencies as string[]) || [],
          complexity: (parsed.complexity as 'simple' | 'medium' | 'complex') || 'medium',
          questions: parsed.questions as string[] | undefined,
        };

        agentStore.setAnalysis(analysis);
        agentStore.addLog(`Analysis complete: ${analysis.intent}`, 'success');
        return analysis;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Analysis failed';
        agentStore.setError(message);
        agentStore.setState('FAILED');
        return null;
      }
    },
    [agentStore, getContext]
  );

  const createPlan = useCallback(
    async (userRequest: string, analysis: AgentAnalysis): Promise<AgentPlan | null> => {
      agentStore.setState('PLANNING');
      agentStore.addLog('Creating execution plan...', 'step');

      try {
        const context = getContext();
        let planContent = '';

        await streamRequest(
          '/api/ai/agent',
          { phase: 'plan', userRequest, analysis, context },
          () => {}
        ).then((content) => {
          planContent = content;
        });

        const parsed = parseJsonFromStream(planContent);
        if (!parsed) {
          throw new Error('Failed to parse plan response');
        }

        const steps: AgentStep[] = ((parsed.steps as Array<Record<string, unknown>>) || []).map(
          (s, i) => ({
            id: (s.id as string) || `step-${i + 1}`,
            title: (s.title as string) || `Step ${i + 1}`,
            description: (s.description as string) || '',
            status: 'pending' as const,
            fileChanges: ((s.fileChanges as Array<Record<string, unknown>>) || []).map((fc) => ({
              filePath: (fc.filePath as string) || '',
              action: (fc.action as 'create' | 'modify' | 'delete') || 'modify',
            })),
          })
        );

        const plan: AgentPlan = {
          id: crypto.randomUUID(),
          userRequest,
          summary: (parsed.summary as string) || '',
          complexity: (parsed.complexity as 'simple' | 'medium' | 'complex') || 'medium',
          estimatedTime: (parsed.estimatedTime as string) || '1-5min',
          steps,
          risks: (parsed.risks as string[]) || [],
          alternatives: parsed.alternatives as string[] | undefined,
          createdAt: new Date(),
        };

        agentStore.setPlan(plan);
        agentStore.addLog(`Plan created with ${steps.length} steps`, 'success');
        return plan;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Planning failed';
        agentStore.setError(message);
        agentStore.setState('FAILED');
        return null;
      }
    },
    [agentStore, getContext]
  );

  const executeStep = useCallback(
    async (
      step: AgentStep,
      plan: AgentPlan,
      userRequest: string
    ): Promise<AgentFileChange | null> => {
      agentStore.updateStep(step.id, { status: 'in_progress', startedAt: new Date() });
      agentStore.addLog(`Executing: ${step.title}`, 'step');

      try {
        const flatFiles = flattenFileTree(fileTreeStore.rootNodes);
        const targetFile = step.fileChanges?.[0];
        let currentFile = '';

        if (targetFile?.action === 'modify') {
          const existingFile = flatFiles.find((f) => f.path === targetFile.filePath);
          currentFile = existingFile?.content || '';
        }

        let executeContent = '';
        await streamRequest(
          '/api/ai/agent',
          { phase: 'execute', step, plan, userRequest, currentFile },
          () => {}
        ).then((content) => {
          executeContent = content;
        });

        const parsed = parseJsonFromStream(executeContent);
        if (!parsed) {
          throw new Error('Failed to parse execute response');
        }

        const fileChange: AgentFileChange = {
          filePath: (parsed.filePath as string) || step.fileChanges?.[0]?.filePath || '',
          action: (parsed.action as 'create' | 'modify' | 'delete') || 'modify',
          originalContent: currentFile,
          newContent: parsed.content as string,
        };

        agentStore.addToRollback({
          ...fileChange,
          originalContent: currentFile,
        });

        agentStore.updateStep(step.id, {
          status: 'completed',
          completedAt: new Date(),
          fileChanges: [fileChange],
        });

        agentStore.addLog(`Completed: ${step.title}`, 'success');
        return fileChange;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Execution failed';
        agentStore.updateStep(step.id, { status: 'failed', error: message });
        return null;
      }
    },
    [agentStore, fileTreeStore.rootNodes]
  );

  const testChanges = useCallback(
    async (
      fileChanges: AgentFileChange[]
    ): Promise<{ hasErrors: boolean; errors: string[] }> => {
      agentStore.setState('TESTING');
      agentStore.addLog('Testing changes...', 'step');

      try {
        let testContent = '';
        await streamRequest(
          '/api/ai/agent',
          { phase: 'test', step: fileChanges },
          () => {}
        ).then((content) => {
          testContent = content;
        });

        const parsed = parseJsonFromStream(testContent);
        const hasErrors = (parsed?.hasErrors as boolean) || false;
        const errors = (parsed?.errors as string[]) || [];

        if (hasErrors) {
          agentStore.addLog(`Found ${errors.length} issues`, 'warning');
        } else {
          agentStore.addLog('All tests passed', 'success');
        }

        return { hasErrors, errors };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Testing failed';
        agentStore.addLog(message, 'error');
        return { hasErrors: true, errors: [message] };
      }
    },
    [agentStore]
  );

  const generateReport = useCallback(
    async (plan: AgentPlan): Promise<void> => {
      agentStore.addLog('Generating report...', 'step');

      try {
        let reportContent = '';
        await streamRequest(
          '/api/ai/agent',
          { phase: 'report', plan },
          () => {}
        ).then((content) => {
          reportContent = content;
        });

        const parsed = parseJsonFromStream(reportContent);
        if (parsed) {
          agentStore.setReport({
            success: (parsed.success as boolean) || true,
            filesModified: (parsed.filesModified as string[]) || [],
            filesCreated: (parsed.filesCreated as string[]) || [],
            filesDeleted: (parsed.filesDeleted as string[]) || [],
            linesAdded: (parsed.linesAdded as number) || 0,
            linesRemoved: (parsed.linesRemoved as number) || 0,
            summary: (parsed.summary as string) || '',
            suggestions: (parsed.suggestions as string[]) || [],
          });
        }

        agentStore.addLog('Report generated', 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Report generation failed';
        agentStore.addLog(message, 'warning');
      }
    },
    [agentStore]
  );

  const runAgentLoop = useCallback(
    async (userRequest: string) => {
      agentStore.reset();
      agentStore.setProcessing(true);
      agentStore.addLog('Starting agent loop...', 'info');

      try {
        const analysis = await analyzeRequest(userRequest);
        if (!analysis) return;

        if (analysis.questions && analysis.questions.length > 0) {
          agentStore.addLog('Clarification needed', 'warning');
          agentStore.setState('IDLE');
          agentStore.setProcessing(false);
          return;
        }

        const plan = await createPlan(userRequest, analysis);
        if (!plan) return;

        agentStore.setState('EXECUTING');
        const allFileChanges: AgentFileChange[] = [];

        for (const step of plan.steps) {
          const fileChange = await executeStep(step, plan, userRequest);
          if (fileChange) {
            allFileChanges.push(fileChange);
          } else {
            const canRetry = agentStore.incrementRetry();
            if (canRetry) {
              const retryChange = await executeStep(step, plan, userRequest);
              if (retryChange) {
                allFileChanges.push(retryChange);
              } else {
                agentStore.addLog(`Step "${step.title}" failed after retry`, 'error');
              }
            } else {
              agentStore.setState('FAILED');
              agentStore.addLog('Agent failed - max retries reached', 'error');
              return;
            }
          }
          agentStore.nextStep();
        }

        const { hasErrors } = await testChanges(allFileChanges);
        
        if (hasErrors) {
          const canRetry = agentStore.incrementRetry();
          if (!canRetry) {
            agentStore.setState('FAILED');
            return;
          }
        }

        await generateReport(plan);
        agentStore.setState('COMPLETED');
        agentStore.addLog('Agent loop completed successfully', 'success');
        agentStore.clearRollback();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Agent loop failed';
        agentStore.setError(message);
        agentStore.setState('FAILED');
      } finally {
        agentStore.setProcessing(false);
      }
    },
    [agentStore, analyzeRequest, createPlan, executeStep, testChanges, generateReport]
  );

  const rollback = useCallback(() => {
    const { rollbackStack } = agentStore;
    agentStore.addLog(`Rolling back ${rollbackStack.length} changes...`, 'warning');
    
    for (const change of rollbackStack.reverse()) {
      if (change.originalContent !== undefined) {
        agentStore.addLog(`Restored: ${change.filePath}`, 'info');
      }
    }
    
    agentStore.clearRollback();
    agentStore.setState('IDLE');
    agentStore.addLog('Rollback complete', 'success');
  }, [agentStore]);

  return {
    runAgentLoop,
    rollback,
    analyzeRequest,
    createPlan,
    executeStep,
    testChanges,
    generateReport,
  };
}
