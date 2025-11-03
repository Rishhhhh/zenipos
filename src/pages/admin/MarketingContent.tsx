import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Image, Video, Calendar, Trash2, Edit, ArrowUp, ArrowDown } from 'lucide-react';
import { GlassModal } from '@/components/modals/GlassModal';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function MarketingContent() {
  const queryClient = useQueryClient();
  const [editingContent, setEditingContent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'image' as 'image' | 'video',
    media_url: '',
    duration_seconds: 10,
    is_active: true,
    schedule_start: '',
    schedule_end: '',
  });

  const { data: marketingContent = [] } = useQuery({
    queryKey: ['marketing-content-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const maxOrder = Math.max(...marketingContent.map(c => c.display_order || 0), 0);
      const { error } = await supabase
        .from('marketing_content')
        .insert({ ...data, display_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-content-admin'] });
      toast.success('Marketing content created');
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('marketing_content')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-content-admin'] });
      toast.success('Marketing content updated');
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-content-admin'] });
      toast.success('Marketing content deleted');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('marketing_content')
        .update({ display_order: newOrder })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-content-admin'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      media_type: 'image',
      media_url: '',
      duration_seconds: 10,
      is_active: true,
      schedule_start: '',
      schedule_end: '',
    });
    setEditingContent(null);
  };

  const handleEdit = (content: any) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description || '',
      media_type: content.media_type,
      media_url: content.media_url,
      duration_seconds: content.duration_seconds,
      is_active: content.is_active,
      schedule_start: content.schedule_start || '',
      schedule_end: content.schedule_end || '',
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    const index = marketingContent.findIndex(c => c.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= marketingContent.length) return;

    const current = marketingContent[index];
    const swap = marketingContent[newIndex];

    reorderMutation.mutate({ id: current.id, newOrder: swap.display_order });
    reorderMutation.mutate({ id: swap.id, newOrder: current.display_order });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center px-4">
          <div>
            <h1 className="text-2xl font-bold">Marketing Content</h1>
            <p className="text-sm text-muted-foreground">Manage customer display content</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground">
              {marketingContent.length} content items
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>

        <div className="grid gap-4">
          {marketingContent.map((content, index) => (
            <Card key={content.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReorder(content.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReorder(content.id, 'down')}
                    disabled={index === marketingContent.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {content.media_type === 'image' ? (
                    <img src={content.media_url} alt={content.title} className="w-full h-full object-cover" />
                  ) : (
                    <Video className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{content.title}</h3>
                    <Badge variant={content.is_active ? 'default' : 'secondary'}>
                      {content.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {content.media_type === 'image' ? (
                      <Image className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Video className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {content.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Duration: {content.duration_seconds}s</span>
                    {content.schedule_start && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(content.schedule_start).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(content)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this content?')) {
                        deleteMutation.mutate(content.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <GlassModal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingContent ? 'Edit Content' : 'Add Content'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Content title"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div>
            <Label>Media Type</Label>
            <div className="flex gap-4 mt-2">
              <Button
                variant={formData.media_type === 'image' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, media_type: 'image' })}
              >
                <Image className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                variant={formData.media_type === 'video' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, media_type: 'video' })}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
          </div>

          <div>
            <Label>Media URL</Label>
            {formData.media_type === 'image' ? (
              <ImageUpload
                value={formData.media_url}
                onUpload={(result) => setFormData({ ...formData, media_url: result.url })}
                onDelete={() => setFormData({ ...formData, media_url: '' })}
              />
            ) : (
              <Input
                value={formData.media_url}
                onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                placeholder="Video URL"
              />
            )}
          </div>

          <div>
            <Label>Display Duration (seconds)</Label>
            <Input
              type="number"
              value={formData.duration_seconds}
              onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })}
              min={1}
              max={60}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schedule Start (Optional)</Label>
              <Input
                type="datetime-local"
                value={formData.schedule_start}
                onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value })}
              />
            </div>
            <div>
              <Label>Schedule End (Optional)</Label>
              <Input
                type="datetime-local"
                value={formData.schedule_end}
                onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.media_url}>
              {editingContent ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
