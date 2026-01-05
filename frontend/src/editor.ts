/**
 * Monaco Editor integration for CodeCollab
 */

import * as monaco from 'monaco-editor';
import type { Language } from './types';

// Monaco Editor instance
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

/**
 * Initialize Monaco Editor
 */
export function initMonacoEditor(container: HTMLElement, initialCode: string = '', language: Language = 'python'): void {
  // Dispose existing editor
  if (editor) {
    editor.dispose();
  }

  // Create editor
  editor = monaco.editor.create(container, {
    value: initialCode,
    language: language,
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    minimap: {
      enabled: true,
      scale: 1,
      size: 'fit'
    },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    padding: {
      top: 10,
      bottom: 10
    },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    tabSize: 4,
    insertSpaces: true,
    folding: true,
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    bracketPairColorization: {
      enabled: true
    }
  });
}

/**
 * Get editor content
 */
export function getEditorValue(): string {
  if (!editor) return '';
  return editor.getValue();
}

/**
 * Set editor content
 */
export function setEditorValue(value: string): void {
  if (!editor) return;
  editor.setValue(value);
}

/**
 * Change editor language
 */
export function setEditorLanguage(language: Language): void {
  if (!editor) return;
  const model = editor.getModel();
  if (model) {
    monaco.editor.setModelLanguage(model, language);
  }
}

/**
 * Focus editor
 */
export function focusEditor(): void {
  if (!editor) return;
  editor.focus();
}

/**
 * Dispose editor
 */
export function disposeEditor(): void {
  if (editor) {
    editor.dispose();
    editor = null;
  }
}

/**
 * Add keyboard shortcut
 */
export function addEditorAction(id: string, label: string, keybinding: number, callback: () => void): void {
  if (!editor) return;
  
  editor.addAction({
    id: id,
    label: label,
    keybindings: [keybinding],
    run: callback
  });
}

/**
 * Get editor instance (for advanced usage)
 */
export function getEditor(): monaco.editor.IStandaloneCodeEditor | null {
  return editor;
}

