'use client';

import { useState } from 'react';
import { usePromptLibraryStore } from '@/store/prompt-library-store';
import type { PromptTemplate } from '@/lib/types';

const CATEGORIES = ['Technology', 'AI', 'Health', 'Fitness', 'Business', 'General'];

interface PromptEditorModalProps {
  initial?: PromptTemplate;
  onClose: () => void;
}

export function PromptEditorModal({ initial, onClose }: PromptEditorModalProps) {
  const { createPrompt, updatePrompt } = usePromptLibraryStore();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'General');
  const [role, setRole] = useState(initial?.role ?? '');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && role.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const data = { name: name.trim(), description: description.trim(), category, role: role.trim() };
    if (isEdit && initial) {
      await updatePrompt(initial.id, data);
    } else {
      await createPrompt(data);
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">
            {isEdit ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Expert Fitness Trainer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    category === cat
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">
              Short Description
              <span className="text-gray-600 ml-1">(shown on library card)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Evidence-based strength coach focused on hypertrophy and progressive overload"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Role / System Prompt */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">
              System Prompt / Expert Persona <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">
              This is injected as the debater&apos;s identity. Be specific — give them credentials, a point of view, and a communication style.
            </p>
            <textarea
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={`You are a certified strength and conditioning specialist with 15 years of experience training elite athletes. You argue from peer-reviewed research on hypertrophy, progressive overload, and sports nutrition. You cite specific studies, give concrete programming recommendations (sets, reps, macros), and push back hard on unsupported claims.`}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-xs focus:outline-none focus:border-indigo-500 resize-y font-mono leading-relaxed"
            />
            <p className="text-xs text-gray-600 mt-1">
              {role.length} characters
            </p>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}
