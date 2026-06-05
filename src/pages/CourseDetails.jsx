import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle2, Circle, Award, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SkillForm from '@/components/courses/SkillForm';

export default function CourseDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills', courseId],
    queryFn: () => base44.entities.Skill.filter({ course_id: courseId }, 'order'),
    enabled: !!courseId
  });

  const toggleMutation = useMutation({
    mutationFn: async (skill) => {
      if (!currentUser) return;
      const completedBy = skill.completed_by || [];
      const isCompleted = completedBy.includes(currentUser.email);
      const newCompletedBy = isCompleted
        ? completedBy.filter(email => email !== currentUser.email)
        : [...completedBy, currentUser.email];
      return base44.entities.Skill.update(skill.id, { completed_by: newCompletedBy });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills', courseId] })
  });

  const saveSkillMutation = useMutation({
    mutationFn: (data) => editingSkill
      ? base44.entities.Skill.update(editingSkill.id, data)
      : base44.entities.Skill.create({ ...data, order: skills.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', courseId] });
      setShowSkillForm(false);
      setEditingSkill(null);
    }
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id) => base44.entities.Skill.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills', courseId] })
  });

  const isCompleted = (skill) => {
    if (!currentUser) return false;
    return (skill.completed_by || []).includes(currentUser.email);
  };

  const completedCount = skills.filter(isCompleted).length;
  const progress = skills.length > 0 ? (completedCount / skills.length) * 100 : 0;

  const levelColors = {
    'Beginner': 'bg-green-500/20 text-green-400',
    'Intermediate': 'bg-blue-500/20 text-blue-400',
    'Advanced': 'bg-purple-500/20 text-purple-400',
    'Expert': 'bg-red-500/20 text-red-400'
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1a7cff', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <p className="text-slate-400">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ background: '#0a0a0acc', borderBottom: '1px solid #1e1e1e' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('Courses')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white truncate flex-1">{course.name}</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Course Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={levelColors[course.level]}>{course.level}</Badge>
                {course.duration && (
                  <span className="text-xs text-slate-400">{course.duration}</span>
                )}
              </div>
              {course.description && (
                <p className="text-slate-300 text-sm">{course.description}</p>
              )}
              {course.prerequisites && (
                <p className="text-xs text-slate-500 mt-2">
                  <span className="text-slate-400">Prerequisites:</span> {course.prerequisites}
                </p>
              )}

              {/* Progress */}
              {skills.length > 0 && currentUser && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Progress</span>
                    <span className="text-sm text-cyan-400">{completedCount}/{skills.length} skills</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-slate-700" />
                  {progress === 100 && (
                    <div className="mt-3 flex items-center gap-2 text-amber-400">
                      <Award className="w-5 h-5" />
                      <span className="text-sm font-medium">Course Completed!</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Skills</h2>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => { setEditingSkill(null); setShowSkillForm(true); }}
                className="gap-1.5"
                style={{ background: '#1a7cff' }}
              >
                <Plus className="w-4 h-4" /> Add Skill
              </Button>
            )}
          </div>

          {skillsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : skills.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              {isAdmin ? 'No skills yet — tap "Add Skill" to get started' : 'No skills added to this course yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center">
                        {/* Completion toggle (non-admin users) */}
                        {currentUser && !isAdmin && (
                          <button
                            onClick={() => toggleMutation.mutate(skill)}
                            className="p-4 border-r border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                          >
                            {isCompleted(skill) ? (
                              <CheckCircle2 className="w-6 h-6 text-green-400" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-500" />
                            )}
                          </button>
                        )}

                        {/* Skill info */}
                        <div className="flex-1 p-4 min-w-0">
                          <h3 className={`font-medium ${isCompleted(skill) && !isAdmin ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {skill.name}
                          </h3>
                          {skill.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{skill.description}</p>
                          )}
                        </div>

                        {/* Admin actions */}
                        {isAdmin && (
                          <div className="flex items-center border-l border-slate-700/50">
                            <button
                              onClick={() => { setEditingSkill(skill); setShowSkillForm(true); }}
                              className="p-3 hover:bg-slate-700/30 text-slate-500 hover:text-blue-400 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${skill.name}"?`)) deleteSkillMutation.mutate(skill.id);
                              }}
                              className="p-3 hover:bg-slate-700/30 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Video button */}
                        {skill.video_url && (
                          <button
                            onClick={() => setSelectedSkill(skill)}
                            className="p-4 border-l border-slate-700/50 hover:bg-cyan-500/10 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: '#1a7cff' }}>
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skill Form */}
      <AnimatePresence>
        {showSkillForm && (
          <SkillForm
            skill={editingSkill}
            courseId={courseId}
            onSave={(data) => saveSkillMutation.mutate(data)}
            onClose={() => { setShowSkillForm(false); setEditingSkill(null); }}
            isLoading={saveSkillMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
            onClick={() => setSelectedSkill(null)}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-white font-medium truncate pr-4">{selectedSkill.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSkill(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
              <div className="w-full max-w-2xl aspect-video bg-slate-900 rounded-xl overflow-hidden">
                <iframe
                  src={selectedSkill.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            {selectedSkill.description && (
              <div className="p-4 border-t border-slate-800">
                <p className="text-slate-400 text-sm">{selectedSkill.description}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}