import { Box, Text, useInput } from 'ink';
import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getAutocompleteSuggestion } from '../input/autocomplete.js';
import { type Action, type DispatchContext, dispatch } from '../input/dispatcher.js';
import { navigateHistory } from '../input/history.js';
import { icons } from '../theme/icons.js';
import { semantic } from '../theme/semantic.js';

type InputState = 'idle' | 'typing' | 'autocompleting' | 'history' | 'submitting' | 'dispatched';

interface InputBoxProps {
  ctx: DispatchContext;
  history: string[];
  onAction: (action: Action) => void;
  onHistoryUpdate: (entries: string[]) => void;
  placeholder?: string;
  onKeystrokeLatency?: ((ms: number) => void) | undefined;
}

export function InputBox({
  ctx,
  history,
  onAction,
  onHistoryUpdate,
  placeholder = 'type a project name or /skill…',
  onKeystrokeLatency,
}: InputBoxProps): React.JSX.Element {
  const [inputState, setInputState] = useState<InputState>('idle');
  const [value, setValue] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef('');
  const keystrokeStartRef = useRef<number | null>(null);
  const onKeystrokeLatencyRef = useRef(onKeystrokeLatency);
  onKeystrokeLatencyRef.current = onKeystrokeLatency;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const historyRef = useRef(history);
  historyRef.current = history;
  const onHistoryUpdateRef = useRef(onHistoryUpdate);
  onHistoryUpdateRef.current = onHistoryUpdate;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Measure time from useInput callback to after render (keystroke latency).
  useLayoutEffect(() => {
    const t0 = keystrokeStartRef.current;
    if (t0 !== null) {
      keystrokeStartRef.current = null;
      const latencyMs = +(performance.now() - t0).toFixed(2);
      onKeystrokeLatencyRef.current?.(latencyMs);
    }
  });

  // Handle dispatch when state transitions to 'submitting'
  useEffect(() => {
    if (inputState !== 'submitting') return;
    let cancelled = false;

    void dispatch(pendingRef.current, ctxRef.current).then((action) => {
      if (cancelled) return;
      setInputState('dispatched');
      onActionRef.current(action);
      setTimeout(() => {
        if (cancelled) return;
        setInputState('idle');
        setValue('');
        setSuggestion(null);
        setHistoryIdx(-1);
        pendingRef.current = '';
      }, 150);
    });

    return () => {
      cancelled = true;
    };
  }, [inputState]);

  const scheduleAutocomplete = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v || v.startsWith('/')) {
      setSuggestion(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const s = getAutocompleteSuggestion(v, ctxRef.current.matcher);
      setSuggestion(s);
      if (s) setInputState('autocompleting');
    }, 30);
  };

  useInput((input, key) => {
    keystrokeStartRef.current = performance.now();
    if (inputState === 'submitting' || inputState === 'dispatched') return;

    if (key.escape) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setInputState('idle');
      setValue('');
      setSuggestion(null);
      setHistoryIdx(-1);
      return;
    }

    if (key.return) {
      const toSubmit = value.trim();
      if (!toSubmit) {
        setInputState('idle');
        return;
      }
      pendingRef.current = toSubmit;
      const newHistory = [...historyRef.current, toSubmit].slice(-100);
      onHistoryUpdateRef.current(newHistory);
      setInputState('submitting');
      return;
    }

    if (key.upArrow) {
      const result = navigateHistory(historyRef.current, historyIdx, 'up');
      setHistoryIdx(result.newIdx);
      setValue(result.entry);
      setSuggestion(null);
      setInputState('history');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (key.downArrow && inputState === 'history') {
      const result = navigateHistory(historyRef.current, historyIdx, 'down');
      setHistoryIdx(result.newIdx);
      setValue(result.entry);
      setInputState(result.newIdx === -1 ? 'idle' : 'history');
      return;
    }

    if (key.tab && inputState === 'autocompleting' && suggestion) {
      setValue(suggestion);
      setSuggestion(null);
      setInputState('typing');
      return;
    }

    if (key.backspace || key.delete) {
      const newVal = value.slice(0, -1);
      setValue(newVal);
      setHistoryIdx(-1);
      setInputState(newVal ? 'typing' : 'idle');
      scheduleAutocomplete(newVal);
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      const newVal = value + input;
      setValue(newVal);
      setHistoryIdx(-1);
      setInputState('typing');
      scheduleAutocomplete(newVal);
    }
  });

  const isIdle = inputState === 'idle' && !value;
  const suffix =
    suggestion && inputState === 'autocompleting' ? suggestion.slice(value.length) : '';

  return (
    <Box borderStyle="single" borderColor={semantic.border} paddingX={1}>
      <Text color={semantic.prompt}>{icons.prompt} </Text>
      {isIdle ? (
        <Text color={semantic.placeholder}>{placeholder}</Text>
      ) : (
        <>
          <Text color={semantic.body}>{value}</Text>
          {suffix ? <Text color={semantic.disabled}>{suffix}</Text> : null}
        </>
      )}
      {inputState === 'submitting' || inputState === 'dispatched' ? (
        <Text color={semantic.inProgress}> …</Text>
      ) : null}
    </Box>
  );
}
