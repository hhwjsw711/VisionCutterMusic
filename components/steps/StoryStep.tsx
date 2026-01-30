'use client';

import { useState } from 'react';
import { useAppStore, Scene } from '@/stores/app-store';
import { storyTemplates } from '@/data/story-templates';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function StoryStep() {
  const { scenes, addScene, updateScene, deleteScene, reorderScenes, setScenes } = useAppStore();
  const [newPrompt, setNewPrompt] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const handleAddScene = () => {
    if (newPrompt.trim()) {
      addScene(newPrompt.trim());
      setNewPrompt('');
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = storyTemplates.find((t) => t.id === templateId);
    if (template) {
      const newScenes: Scene[] = template.scenes.map((prompt) => ({
        id: crypto.randomUUID(),
        prompt,
        status: 'pending',
      }));
      setScenes(newScenes);
      setShowTemplates(false);
    }
  };

  const handleStartEdit = (scene: Scene) => {
    setEditingScene(scene.id);
    setEditPrompt(scene.prompt);
  };

  const handleSaveEdit = (id: string) => {
    if (editPrompt.trim()) {
      updateScene(id, { prompt: editPrompt.trim() });
    }
    setEditingScene(null);
    setEditPrompt('');
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < scenes.length) {
      reorderScenes(index, newIndex);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="text-center mb-12 animate-slide-up">
        <h2 className="font-display text-5xl md:text-6xl uppercase tracking-wider mb-4">
          <span className="gradient-text">Build Your Story</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg max-w-lg mx-auto">
          Create scenes that tell your visual narrative
        </p>
      </div>

      {/* Template Button */}
      <div className="flex justify-center mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Button
          variant="secondary"
          onClick={() => setShowTemplates(!showTemplates)}
          className="gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {showTemplates ? 'Hide Templates' : 'Use Story Template'}
        </Button>
      </div>

      {/* Templates Grid */}
      {showTemplates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-scale-in">
          {storyTemplates.map((template) => (
            <Card
              key={template.id}
              variant="interactive"
              onClick={() => handleApplyTemplate(template.id)}
              className="group"
            >
              <CardContent className="py-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-[var(--ink)] flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-2xl text-[var(--paper)]">{template.scenes.length}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-wider text-[var(--ink)] group-hover:text-[var(--red)] transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      {template.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Scene Input */}
      <Card variant="default" className="mb-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <CardContent className="py-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Describe a scene..."
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddScene()}
              className="flex-1"
            />
            <Button onClick={handleAddScene} disabled={!newPrompt.trim()}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scene List */}
      {scenes.length === 0 ? (
        <Card variant="default" className="animate-scale-in">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-[var(--paper-dark)] border-2 border-[var(--ink)] flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-display text-2xl uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              No Scenes Yet
            </h3>
            <p className="text-[var(--text-muted)] max-w-sm mx-auto">
              Add scenes one by one or use a template to get started quickly
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 stagger-children">
          {scenes.map((scene, index) => (
            <Card key={scene.id} variant="default" className="group">
              <CardContent className="py-4 flex items-start gap-4">
                {/* Scene number */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <span className="w-10 h-10 bg-[var(--red)] flex items-center justify-center font-mono text-sm text-white">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveScene(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-[var(--paper-dark)] border border-transparent hover:border-[var(--ink)] disabled:opacity-30 transition-all"
                    >
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveScene(index, 'down')}
                      disabled={index === scenes.length - 1}
                      className="p-1 hover:bg-[var(--paper-dark)] border border-transparent hover:border-[var(--ink)] disabled:opacity-30 transition-all"
                    >
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Scene content */}
                <div className="flex-1 min-w-0">
                  {editingScene === scene.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(scene.id)}
                        autoFocus
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => handleSaveEdit(scene.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingScene(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <p
                      className="text-[var(--ink)] cursor-pointer hover:text-[var(--red)] transition-colors"
                      onClick={() => handleStartEdit(scene)}
                    >
                      {scene.prompt}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteScene(scene.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[var(--red-soft)] border border-transparent hover:border-[var(--red)] text-[var(--red)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scene count */}
      {scenes.length > 0 && (
        <div className="mt-6 text-center animate-fade-in">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wider">
            <span className="text-[var(--red)]">{scenes.length}</span>
            {' '}scene{scenes.length !== 1 ? 's' : ''} ready for generation
          </p>
        </div>
      )}
    </div>
  );
}
