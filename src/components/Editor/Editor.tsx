import React, { useEffect, useState } from 'react';
import {
  Textarea,
  Button,
  Paper,
  Group,
  Modal,
  TextInput,
  Collapse,
  ScrollArea,
  Badge,
  Title,
} from '@mantine/core';

type LogEntry = { ts: string; level: 'info' | 'error'; message: string };

export function Editor() {
  const [text, setText] = useState<string>(() => localStorage.getItem('previhtml:text') || '');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('previhtml:openrouter_key') || '');
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const raw = localStorage.getItem('previhtml:logs');
    return raw ? JSON.parse(raw) : [];
  });
  const [showSettings, setShowSettings] = useState(false);
  const [logOpen, setLogOpen] = useState<boolean>(() => localStorage.getItem('previhtml:log_open') === '1');
  const [generatedHtml, setGeneratedHtml] = useState<string>(localStorage.getItem('previhtml:generated_html') || '');

  function addLog(level: LogEntry['level'], message: string) {
    const entry = { ts: new Date().toISOString(), level, message };
    setLogs((prev) => {
      const next = [...prev, entry].slice(-500);
      try {
        localStorage.setItem('previhtml:logs', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }

  useEffect(() => {
    localStorage.setItem('previhtml:text', text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem('previhtml:openrouter_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('previhtml:generated_html', generatedHtml);
  }, [generatedHtml]);

  useEffect(() => {
    localStorage.setItem('previhtml:log_open', logOpen ? '1' : '0');
  }, [logOpen]);

  // interval autosave every 5s
  useEffect(() => {
    const id = setInterval(() => {
      try {
        localStorage.setItem('previhtml:text', text);
        localStorage.setItem('previhtml:last_saved', new Date().toISOString());
        addLog('info', 'Autosaved to localStorage');
      } catch (e: any) {
        addLog('error', `Autosave failed: ${e?.message || String(e)}`);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [text]);

  async function generateHtml() {
    addLog('info', 'Generate requested');
    if (!apiKey) {
      const html = `<div><p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p></div>`;
      setGeneratedHtml(html);
      addLog('info', 'Used local fallback formatter (no API key)');
      return;
    }

    const start = Date.now();
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Receive a single block of plain text and return stylistic HTML. Only output HTML string.' },
        { role: 'user', content: text },
      ],
      max_tokens: 1200,
    };

    function truncate(s: string, n = 1000) {
      return s.length > n ? s.slice(0, n) + '... (truncated)' : s;
    }

    try {
      addLog('info', 'Calling OpenRouter (client-side) - preparing request');
      addLog('info', `Request payload preview: ${truncate(JSON.stringify(payload))}`);

      const controller = new AbortController();
      const timeoutMs = 20000; // 20s
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      addLog('info', `Sending request to openrouter.ai (timeout ${timeoutMs}ms)`);
      const res = await fetch('https://openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      addLog('info', `HTTP response: ${res.status} ${res.statusText}`);
      const textResp = await res.text();
      addLog('info', `Response body preview (${textResp.length} chars): ${truncate(textResp, 2000)}`);

      let j: any = null;
      try {
        j = JSON.parse(textResp);
        addLog('info', 'Parsed JSON response');
      } catch (e: any) {
        addLog('error', `Failed to parse JSON response: ${e?.message || String(e)}`);
      }

      if (!res.ok) {
        addLog('error', `OpenRouter error: ${res.status} ${res.statusText} - ${truncate(textResp)}`);
        setGeneratedHtml(`<!-- OpenRouter error: ${res.status} ${res.statusText} -->`);
        return;
      }

      const content = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || j?.result || (j ? JSON.stringify(j) : textResp);
      setGeneratedHtml(content);
      addLog('info', `OpenRouter returned content (${(content || '').length} chars) in ${Date.now() - start}ms`);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        addLog('error', 'OpenRouter request timed out (abort)');
        setGeneratedHtml('<!-- request timed out -->');
      } else {
        addLog('error', `OpenRouter request failed: ${err?.message || String(err)}`);
        setGeneratedHtml(`<!-- request failed: ${err?.message || String(err)} -->`);
      }
    }
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]!));
  }

  function copyHtml() {
    if (!generatedHtml) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedHtml);
      addLog('info', 'Copied generated HTML to clipboard');
    } else {
      addLog('error', 'Clipboard API not available');
    }
  }

  function downloadHtml() {
    const blob = new Blob([generatedHtml || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'previhtml_autosave.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addLog('info', 'Downloaded generated HTML as file');
  }

  return (
    <Paper p="md">
      <Group position="apart" mb="sm">
        <div>
          <Title order={4} mb="xs">Editor</Title>
        </div>
        <Group spacing="xs">
          <Badge color={apiKey ? 'teal' : 'gray'}>{apiKey ? 'OpenRouter: configured' : 'Offline (no key)'}</Badge>
          <Button size="xs" onClick={() => setShowSettings(true)}>Settings</Button>
          <Button size="xs" onClick={() => generateHtml()}>Generate HTML</Button>
          <Button size="xs" onClick={() => copyHtml()} disabled={!generatedHtml}>Copy HTML</Button>
          <Button size="xs" onClick={() => downloadHtml()} disabled={!generatedHtml}>Save File</Button>
          <Button size="xs" onClick={() => setLogOpen((v) => !v)}>{logOpen ? 'Hide Logs' : 'Show Logs'}</Button>
        </Group>
      </Group>

      <Textarea
        placeholder="Type the text that you want styled by the LLM..."
        minRows={12}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
      />

      <Collapse in={!!generatedHtml} mt="md">
        <Paper p="sm" withBorder>
          <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
        </Paper>
      </Collapse>

      <Collapse in={logOpen} mt="md">
        <Paper p="sm" withBorder style={{ height: 220 }}>
          <ScrollArea style={{ height: '100%' }}>
            {logs.map((l, idx) => (
              <div key={idx} style={{ fontSize: 12, marginBottom: 6, color: l.level === 'error' ? '#c92a2a' : undefined }}>
                <strong>[{l.ts}]</strong> {l.message}
              </div>
            ))}
          </ScrollArea>
        </Paper>
      </Collapse>

      <Modal opened={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <TextInput
          label="OpenRouter API Key"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.currentTarget.value)}
        />
        <Group position="right" mt="md">
          <Button
            onClick={() => {
              localStorage.setItem('previhtml:openrouter_key', apiKey);
              addLog('info', 'Saved API key to localStorage');
              setShowSettings(false);
            }}
          >
            Save
          </Button>
        </Group>
      </Modal>
    </Paper>
  );
}
