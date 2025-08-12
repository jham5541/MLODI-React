import { supabase } from './databaseService';

export interface CollaborationProject {
  id: string;
  title: string;
  type: 'song' | 'album' | 'playlist' | 'remix';
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  progress: number;
  lastActivity: number;
  description?: string;
  deadline?: number;
  genre?: string;
  owner: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  collaborators: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
    status: 'active' | 'inactive';
  }>;
}

export interface CollaborationRole {
  id: string;
  name: string;
}

class CollaborationService {
  async getProjects(userId: string, status?: 'active' | 'pending' | 'completed'): Promise<CollaborationProject[]> {
    // Helper to map DB row to CollaborationProject
    const mapProject = (project: any): CollaborationProject => ({
      id: project.id,
      title: project.title,
      type: project.type,
      status: project.status,
      progress: project.progress,
      lastActivity: new Date(project.last_activity).getTime(),
      description: project.description,
      deadline: project.deadline ? new Date(project.deadline).getTime() : undefined,
      genre: project.genre,
      owner: {
        id: project.owner.id,
        username: project.owner.username,
        displayName: project.owner.display_name,
        avatarUrl: project.owner.avatar_url,
      },
      collaborators: (project.collaborators || []).map((collab: any) => ({
        id: collab.user.id,
        username: collab.user.username,
        displayName: collab.user.display_name,
        avatarUrl: collab.user.avatar_url,
        role: collab.role.name,
        status: collab.status,
      })),
    });

    // 1) Projects owned by the user
    const ownedQuery = supabase
      .from('collaboration_projects')
      .select(`
        *,
        owner:profiles!owner_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        collaborators:collaborators (
          id,
          status,
          user:profiles!user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          role:collaboration_roles!role_id (
            name
          )
        )
      `)
      .eq('owner_id', userId)
      .eq('status', status || 'active');

    const { data: owned, error: ownedErr } = await ownedQuery;
    if (ownedErr) {
      console.error('Error fetching owned projects:', ownedErr);
      throw ownedErr;
    }

    // 2) Projects where the user is a collaborator (inner join)
    const collabQuery = supabase
      .from('collaboration_projects')
      .select(`
        *,
        owner:profiles!owner_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        collaborators:collaborators!inner (
          id,
          status,
          user_id,
          user:profiles!user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          role:collaboration_roles!role_id (
            name
          )
        )
      `)
      .eq('collaborators.user_id', userId)
      .eq('status', status || 'active');

    const { data: collab, error: collabErr } = await collabQuery;
    if (collabErr) {
      console.error('Error fetching collaborator projects:', collabErr);
      throw collabErr;
    }

    // Merge and de-duplicate by id
    const byId = new Map<string, any>();
    (owned || []).forEach((p: any) => byId.set(p.id, p));
    (collab || []).forEach((p: any) => byId.set(p.id, p));

    const merged = Array.from(byId.values())
      .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())
      .map(mapProject);

    return merged;
  }

  async createProject(
    ownerId: string,
    data: {
      title: string;
      type: 'song' | 'album' | 'playlist' | 'remix';
      description?: string;
      deadline?: Date;
      genre?: string;
    }
  ): Promise<string> {
    const { data: project, error } = await supabase
      .from('collaboration_projects')
      .insert({
        owner_id: ownerId,
        title: data.title,
        type: data.type,
        status: 'pending',
        progress: 0,
        description: data.description,
        deadline: data.deadline?.toISOString(),
        genre: data.genre,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    return project.id;
  }

  async updateProject(
    projectId: string,
    ownerId: string,
    data: {
      title?: string;
      status?: 'active' | 'completed' | 'pending' | 'cancelled';
      progress?: number;
      description?: string;
      deadline?: Date;
      genre?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('collaboration_projects')
      .update({
        ...data,
        deadline: data.deadline?.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string, ownerId: string): Promise<void> {
    const { error } = await supabase
      .from('collaboration_projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async addCollaborator(
    projectId: string,
    ownerId: string,
    userId: string,
    roleId: string
  ): Promise<void> {
    // First verify the user is the owner
    const { data: project, error: projectError } = await supabase
      .from('collaboration_projects')
      .select()
      .eq('id', projectId)
      .eq('owner_id', ownerId)
      .single();

    if (projectError || !project) {
      throw new Error('Unauthorized or project not found');
    }

    const { error } = await supabase
      .from('collaborators')
      .insert({
        project_id: projectId,
        user_id: userId,
        role_id: roleId,
        status: 'active',
      });

    if (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  async updateCollaboratorStatus(
    projectId: string,
    ownerId: string,
    userId: string,
    status: 'active' | 'inactive'
  ): Promise<void> {
    // First verify the user is the owner
    const { data: project, error: projectError } = await supabase
      .from('collaboration_projects')
      .select()
      .eq('id', projectId)
      .eq('owner_id', ownerId)
      .single();

    if (projectError || !project) {
      throw new Error('Unauthorized or project not found');
    }

    const { error } = await supabase
      .from('collaborators')
      .update({ status })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating collaborator status:', error);
      throw error;
    }
  }

  async removeCollaborator(
    projectId: string,
    ownerId: string,
    userId: string
  ): Promise<void> {
    // First verify the user is the owner
    const { data: project, error: projectError } = await supabase
      .from('collaboration_projects')
      .select()
      .eq('id', projectId)
      .eq('owner_id', ownerId)
      .single();

    if (projectError || !project) {
      throw new Error('Unauthorized or project not found');
    }

    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  async addUpdate(
    projectId: string,
    userId: string,
    content: string,
    mediaContent?: any // Support media content as JSONB
  ): Promise<void> {
    const { error } = await supabase
      .from('collaboration_updates')
      .insert({
        project_id: projectId,
        user_id: userId,
        content,
        media_content: mediaContent
      });

    if (error) {
      console.error('Error adding update:', error);
      throw error;
    }
  }

  async getProjectUpdates(projectId: string, limit = 20) {
    const { data, error } = await supabase
      .from('collaboration_updates')
      .select(`
        *,
        user:profiles!user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching project updates:', error);
      throw error;
    }

    return data.map((update: any) => ({
      id: update.id,
      content: update.content,
      createdAt: new Date(update.created_at).getTime(),
      user: {
        username: update.user.username,
        displayName: update.user.display_name,
        avatarUrl: update.user.avatar_url,
      },
    }));
  }

  async getAvailableRoles(): Promise<CollaborationRole[]> {
    const { data, error } = await supabase
      .from('collaboration_roles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }

    return data;
  }

  // Subscribe to project updates
  subscribeToProjectUpdates(projectId: string, callback: (update: any) => void) {
    return supabase
      .channel(`collaboration:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_updates',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the complete update with user info
            const { data, error } = await supabase
              .from('collaboration_updates')
              .select(`
                *,
                user:profiles!user_id (
                  username,
                  display_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && data) {
              callback({
                id: data.id,
                content: data.content,
                createdAt: new Date(data.created_at).getTime(),
                user: {
                  username: data.user.username,
                  displayName: data.user.display_name,
                  avatarUrl: data.user.avatar_url,
                },
              });
            }
          }
        }
      )
      .subscribe();
  }

  // Subscribe to project changes
  subscribeToProjectChanges(projectId: string, callback: (project: CollaborationProject) => void) {
    return supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_projects',
          filter: `id=eq.${projectId}`,
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            // Fetch the complete project data
            const { data: projects, error } = await supabase
              .from('collaboration_projects')
              .select(`
                *,
                owner:profiles!owner_id (
                  id,
                  username,
                  display_name,
                  avatar_url
                ),
                collaborators:collaborators (
                  id,
                  status,
                  user:profiles!user_id (
                    id,
                    username,
                    display_name,
                    avatar_url
                  ),
                  role:collaboration_roles!role_id (
                    name
                  )
                )
              `)
              .eq('id', projectId)
              .single();

            if (!error && projects) {
              callback({
                id: projects.id,
                title: projects.title,
                type: projects.type,
                status: projects.status,
                progress: projects.progress,
                lastActivity: new Date(projects.last_activity).getTime(),
                description: projects.description,
                deadline: projects.deadline ? new Date(projects.deadline).getTime() : undefined,
                genre: projects.genre,
                owner: {
                  id: projects.owner.id,
                  username: projects.owner.username,
                  displayName: projects.owner.display_name,
                  avatarUrl: projects.owner.avatar_url,
                },
                collaborators: projects.collaborators.map((collab: any) => ({
                  id: collab.user.id,
                  username: collab.user.username,
                  displayName: collab.user.display_name,
                  avatarUrl: collab.user.avatar_url,
                  role: collab.role.name,
                  status: collab.status,
                })),
              });
            }
          }
        }
      )
      .subscribe();
  }
}

export const collaborationService = new CollaborationService();
