import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PullToRefresh from '@/components/ui/PullToRefresh';
import CourseForm from '@/components/courses/CourseForm';

export default function Courses() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('order')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingCourse
      ? base44.entities.Course.update(editingCourse.id, data)
      : base44.entities.Course.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowForm(false);
      setEditingCourse(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] })
  });

  const handleEdit = (e, course) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleDelete = (e, course) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete "${course.name}"?`)) {
      deleteMutation.mutate(course.id);
    }
  };

  const levelColors = {
    'Beginner': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Intermediate': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Advanced': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Expert': 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ background: '#0a0a0acc', borderBottom: '1px solid #1e1e1e' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Courses</h1>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => { setEditingCourse(null); setShowForm(true); }}
              className="gap-1.5"
              style={{ background: '#1a7cff' }}
            >
              <Plus className="w-4 h-4" /> Add Course
            </Button>
          )}
        </div>
      </div>

      <PullToRefresh onRefresh={refetch}>
        <div className="px-5 py-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400">No courses available yet</p>
              {isAdmin && (
                <p className="text-slate-600 text-sm mt-1">Tap "Add Course" to get started</p>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link to={createPageUrl(`CourseDetails?id=${course.id}`)}>
                    <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden hover:bg-slate-800/70 transition-all active:scale-[0.98]">
                      <CardContent className="p-0">
                        {course.image_url && (
                          <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
                            <img src={course.image_url} alt={course.name} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${levelColors[course.level]} border text-xs`}>{course.level}</Badge>
                                {course.duration && (
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{course.duration}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-white font-semibold text-lg">{course.name}</h3>
                              {course.description && (
                                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{course.description}</p>
                              )}
                              {course.prerequisites && (
                                <p className="text-xs text-slate-500 mt-2">
                                  <span className="text-slate-400">Prerequisites:</span> {course.prerequisites}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={(e) => handleEdit(e, course)}
                                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-blue-400 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(e, course)}
                                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <ChevronRight className="w-5 h-5 text-slate-500 mt-0.5" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <AnimatePresence>
        {showForm && (
          <CourseForm
            course={editingCourse}
            onSave={(data) => saveMutation.mutate(data)}
            onClose={() => { setShowForm(false); setEditingCourse(null); }}
            isLoading={saveMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}