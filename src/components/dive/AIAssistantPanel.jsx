import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIAssistantPanel() {
  const [activeTab, setActiveTab] = useState('insights');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateDiveRecommendations', {});
      setRecommendations(data.recommendations || []);
      setActiveTab('recommendations');
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('analyzeDivePatterns', {});
      setInsights(data.insights || []);
      setActiveTab('insights');
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleExpand = async () => {
    setExpanded(!expanded);
    if (!expanded && insights.length === 0 && recommendations.length === 0) {
      await fetchInsights();
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
        style={{ background: '#1a7cff20', border: '1px solid #1a7cff40' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#1a7cff' }} />
          <span className="text-sm font-medium text-slate-300">AI Assistant</span>
        </div>
        <ChevronDown
          className="w-4 h-4 text-slate-400 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Tab buttons */}
            <div className="flex gap-2">
              <button
                onClick={fetchInsights}
                className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                  activeTab === 'insights'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                style={activeTab === 'insights' ? { background: '#1a7cff' } : {}}
              >
                Insights
              </button>
              <button
                onClick={fetchRecommendations}
                className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                  activeTab === 'recommendations'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                style={activeTab === 'recommendations' ? { background: '#1a7cff' } : {}}
              >
                Recommendations
              </button>
            </div>

            {/* Content */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                ) : activeTab === 'insights' ? (
                  <div className="space-y-2">
                    {insights.length > 0 ? (
                      insights.map((insight, i) => (
                        <p key={i} className="text-xs text-slate-300 leading-relaxed">
                          • {insight}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Click "Insights" to generate AI analysis</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recommendations.length > 0 ? (
                      recommendations.map((rec, i) => (
                        <p key={i} className="text-xs text-slate-300 leading-relaxed">
                          • {rec}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Click "Recommendations" to generate suggestions</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}