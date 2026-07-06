import type { Signal } from '../../contracts/observation';

export interface SignalGroup {
  id: string;
  signals: Signal[];
  type: string;
}

export function correlateSignals(signals: Signal[]): SignalGroup[] {
  const groups: Map<string, Signal[]> = new Map();

  for (const signal of signals) {
    let groupKey = '';

    // 1. Group by Slack Thread if available
    const threadTs = signal.context.threadTs as string;
    if (signal.source === 'slack' && threadTs) {
      groupKey = `thread:${signal.context.channelId}:${threadTs}`;
    } else {
      // 2. Group by semantic keywords (e.g. check for common checkout crash signals)
      const contentLower = signal.content.toLowerCase();
      if (contentLower.includes('checkout') && (contentLower.includes('500') || contentLower.includes('crash') || contentLower.includes('failed'))) {
        groupKey = `semantic:checkout_crash:${signal.context.channelId}`;
      } else if (contentLower.includes('pull request') || contentLower.includes('github.com') || contentLower.includes('/pull/')) {
        groupKey = `semantic:pr_link:${signal.id}`; // separate group per PR signal
      } else if (contentLower.includes('?') && signal.content.length > 10) {
        groupKey = `semantic:question:${signal.id}`; // separate group per question signal
      } else {
        groupKey = `uncorrelated:${signal.id}`;
      }
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(signal);
  }

  const result: SignalGroup[] = [];
  groups.forEach((sigList, key) => {
    const sortedIds = sigList.map(s => s.id).sort().join('|');
    const type = key.startsWith('thread:') 
      ? 'thread' 
      : (key.startsWith('semantic:checkout_crash') ? 'checkout_crash' : 'single');

    result.push({
      id: sortedIds,
      signals: sigList,
      type
    });
  });

  return result;
}
