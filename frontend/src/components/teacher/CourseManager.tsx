'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Youtube, FileText, Link as LinkIcon, Video } from 'lucide-react';
import { coursesAPI } from '@/services/api/dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import type { Course } from '@/types';

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', zoomLink: '', googleClassroomLink: '',
    content: [] as Array<{ contentType: string; title: string; url: string; durationMinutes: number; order: number }>,
  });
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentForm, setContentForm] = useState({
    contentType: 'video',
    title: '',
    url: '',
    durationMinutes: 0,
  });

  const loadCourses = () => {
    coursesAPI.getMy().then((res) => setCourses(res.data.courses || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadCourses(); }, []);

  const createCourse = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    try {
      const courseData = {
        title: form.title,
        description: form.description,
        integrations: { zoomLink: form.zoomLink, googleClassroomLink: form.googleClassroomLink },
        content: form.content,
      };
      console.log('Creating course with data:', courseData);
      await coursesAPI.create(courseData);
      toast.success('Course created');
      setShowForm(false);
      setForm({ title: '', description: '', zoomLink: '', googleClassroomLink: '', content: [] });
      loadCourses();
    } catch (err: unknown) {
      console.error('Failed to create course:', err);
      const message = (err as { response?: { data?: { message?: string; errors?: unknown[] } } })?.response?.data?.message;
      const errors = (err as { response?: { data?: { errors?: unknown[] } } })?.response?.data?.errors;
      console.error('Error details:', { message, errors });
      toast.error(message || 'Failed to create course');
    }
  };

  const addContent = () => {
    if (!contentForm.title.trim() || !contentForm.url.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    setForm({
      ...form,
      content: [
        ...form.content,
        {
          ...contentForm,
          order: form.content.length,
        },
      ],
    });
    setContentForm({ contentType: 'video', title: '', url: '', durationMinutes: 0 });
    setShowContentForm(false);
  };

  const removeContent = (index: number) => {
    setForm({
      ...form,
      content: form.content.filter((_, i) => i !== index),
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-heading">Course Management</h1>
            <button onClick={() => setShowForm(!showForm)} className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white">
              {showForm ? 'Cancel' : 'Create Course'}
            </button>
          </div>

          {showForm && (
            <div className="mb-8 glass-card space-y-4 p-6">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Course title" className="w-full rounded-xl border px-4 py-3" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full rounded-xl border px-4 py-3" />
              <input value={form.zoomLink} onChange={(e) => setForm({ ...form, zoomLink: e.target.value })} placeholder="Zoom link (optional)" className="w-full rounded-xl border px-4 py-3" />
              <input value={form.googleClassroomLink} onChange={(e) => setForm({ ...form, googleClassroomLink: e.target.value })} placeholder="Google Classroom link (optional)" className="w-full rounded-xl border px-4 py-3" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-heading">Course Content</h3>
                  <button onClick={() => setShowContentForm(!showContentForm)} className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                    <Plus className="h-4 w-4" /> Add Content
                  </button>
                </div>

                {showContentForm && (
                  <div className="space-y-3 rounded-xl bg-background p-4">
                    <select
                      value={contentForm.contentType}
                      onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value })}
                      className="w-full rounded-xl border px-4 py-2"
                    >
                      <option value="video">Video File</option>
                      <option value="youtube">YouTube Video</option>
                      <option value="document">Document</option>
                      <option value="link">External Link</option>
                    </select>
                    <input
                      value={contentForm.title}
                      onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                      placeholder="Content title"
                      className="w-full rounded-xl border px-4 py-2"
                    />
                    <input
                      value={contentForm.url}
                      onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                      placeholder={contentForm.contentType === 'youtube' ? 'YouTube video URL (e.g., https://youtube.com/watch?v=...)' : 'Content URL'}
                      className="w-full rounded-xl border px-4 py-2"
                    />
                    <input
                      type="number"
                      value={contentForm.durationMinutes || ''}
                      onChange={(e) => setContentForm({ ...contentForm, durationMinutes: parseInt(e.target.value) || 0 })}
                      placeholder="Duration in minutes (optional)"
                      className="w-full rounded-xl border px-4 py-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={addContent} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Add</button>
                      <button onClick={() => setShowContentForm(false)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {form.content.length > 0 && (
                  <div className="space-y-2">
                    {form.content.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-xl bg-background px-4 py-2">
                        {getContentTypeIcon(item.contentType)}
                        <span className="flex-1 text-sm font-medium text-heading">{item.title}</span>
                        <button onClick={() => removeContent(index)} className="text-danger hover:text-danger/80">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={createCourse} className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white">Save Course</button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <div key={course._id} className="glass-card p-6">
                <h3 className="font-bold text-heading">{course.title}</h3>
                <p className="mb-4 text-sm text-body">{course.description}</p>
                <div className="flex gap-4 text-sm text-body">
                  <span>{course.enrolledStudents?.length || 0} students</span>
                  <span>{course.content?.length || 0} content items</span>
                </div>
              </div>
            ))}
            {courses.length === 0 && <p className="text-body">No courses yet. Create your first course!</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
