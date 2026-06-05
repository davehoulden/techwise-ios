import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AITagSuggestions({ description, location, gasMix, onTagsSelect }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const fetchSuggestions = async () => {
    if (!description && !location && !gasMix) return;
    
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('suggestDiveTags', {
        description,
        location,
        gas_mix: gasMix
      });
      setTags(data.tags || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const toggleTag = (tag) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updated);
    onTagsSelect?.(updated);
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={fetchSuggestions}
        disabled={loading}
        variant="outline"
        size="sm"
        className="w-full text-slate-400 border-slate-700"
      >
        {loading ? (
          <>
            <Loader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Generating tags...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            AI Suggest Tags
          </>
        )}
      </Button>

      {tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Click to select:</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="transition-all"
              >
                <Badge
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className={selectedTags.includes(tag) ? 'bg-blue-600' : 'border-slate-700'}
                >
                  {tag}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}