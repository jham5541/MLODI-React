import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import CollaborationHub from './CollaborationHub';
import { collaborationService, CollaborationProject } from '../../services/collaborationService';
import CollaborationDetailModal from './CollaborationDetailModal';

interface CollaborationContainerProps {
  artistId: string;
}

export default function CollaborationContainer({ artistId }: CollaborationContainerProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CollaborationProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CollaborationProject | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [acceptedProjects, setAcceptedProjects] = useState<Record<string, boolean>>({});
  const [completedProjects, setCompletedProjects] = useState<Record<string, boolean>>({});

  const loadProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      const projectData = await collaborationService.getProjects(artistId);
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading projects:', error);
      // Do not show a blocking popup; fail silently and allow the UI to render an empty state
    } finally {
      setIsLoading(false);
    }
  }, [artistId, user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  const handleCreateProject = useCallback(async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to create a project');
      return;
    }

    // Here you would typically navigate to a project creation screen
    // For now, we'll just show an alert
    Alert.alert('Create Project', 'Project creation screen would open here');
  }, [user]);

  const handleProjectPress = useCallback((project: CollaborationProject) => {
    setSelectedProject(project);
    setModalVisible(true);
  }, []);

  if (!user) {
    return (
      <CollaborationHub
        projects={[]}
        onCreateProject={handleCreateProject}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        onProjectPress={handleProjectPress}
      />
    );
  }

  // Show only active collaborations initially, then show specific ones based on user actions
  const visibleProjects = projects
    .filter(p => {
      // If it's not one you interacted with, only show if active
      if (!acceptedProjects[p.id] && !completedProjects[p.id]) {
        return p.status === 'active';
      }
      // If you paid for it, show it (with updated status)
      return true;
    })
    .map(p => {
      // If you've completed it, show as completed
      if (completedProjects[p.id]) {
        return { ...p, status: 'completed' as const, progress: 100 };
      }
      // If you've paid for it, show as pending
      if (acceptedProjects[p.id]) {
        return { ...p, status: 'pending' as const };
      }
      // Otherwise show original status (should be active based on filter)
      return p;
    });

  return (
    <>
      <CollaborationHub
        projects={visibleProjects}
        onCreateProject={handleCreateProject}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        onProjectPress={handleProjectPress}
      />

      {selectedProject && (
        <CollaborationDetailModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedProject(null);
            // refresh to reflect any status changes
            loadProjects();
          }}
          project={selectedProject}
          onProjectAccepted={(projectId) => {
            setAcceptedProjects(prev => ({ ...prev, [projectId]: true }));
          }}
          onProjectCompleted={(projectId) => {
            setCompletedProjects(prev => ({ ...prev, [projectId]: true }));
          }}
        />
      )}
    </>
  );
}
