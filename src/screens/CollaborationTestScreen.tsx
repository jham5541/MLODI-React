import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme, colors } from '../context/ThemeContext';
import { collaborationService } from '../services/collaborationService';
import CollaborationHub from '../components/collaboration/CollaborationHub';
import CollaborationDetailModal from '../components/collaboration/CollaborationDetailModal';

export default function CollaborationTestScreen() {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [testResults, setTestResults] = useState({
    supabaseConnection: 'pending',
    authStatus: 'pending',
    tableAccess: 'pending',
    realtimeConnection: 'pending',
  });

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setIsLoading(true);
    const results = { ...testResults };

    // Test 1: Auth Status
    try {
      if (user) {
        results.authStatus = 'success';
        console.log('✅ Auth Status: User authenticated', user.id);
      } else {
        results.authStatus = 'failed';
        console.log('❌ Auth Status: No user');
      }
    } catch (error) {
      results.authStatus = 'error';
      console.error('Auth test error:', error);
    }

    // Test 2: Supabase Connection & Table Access
    try {
      const testProjects = await collaborationService.getProjects(
        user?.id || 'test-user-id',
        'active'
      );
      results.supabaseConnection = 'success';
      results.tableAccess = 'success';
      console.log('✅ Supabase Connection: Success');
      console.log('✅ Table Access: Retrieved projects', testProjects);
      setProjects(testProjects);
    } catch (error) {
      results.supabaseConnection = 'error';
      results.tableAccess = 'error';
      console.error('❌ Supabase/Table test error:', error);
    }

    // Test 3: Realtime Connection
    try {
      // Test subscription (will unsubscribe immediately)
      const subscription = collaborationService.subscribeToProjectUpdates(
        'test-project-id',
        (update) => {
          console.log('Realtime update received:', update);
        }
      );
      
      if (subscription) {
        results.realtimeConnection = 'success';
        console.log('✅ Realtime Connection: Success');
        subscription.unsubscribe();
      } else {
        results.realtimeConnection = 'failed';
      }
    } catch (error) {
      results.realtimeConnection = 'error';
      console.error('❌ Realtime test error:', error);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const createTestProject = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    try {
      setIsLoading(true);
      const projectId = await collaborationService.createProject(user.id, {
        title: `Test Project ${Date.now()}`,
        type: 'song',
        description: 'Test collaboration project',
        genre: 'Electronic',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      });
      
      Alert.alert('Success', `Project created with ID: ${projectId}`);
      await runTests(); // Refresh
    } catch (error) {
      console.error('Create project error:', error);
      Alert.alert('Error', `Failed to create project: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'error':
        return '⚠️';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return themeColors.success;
      case 'failed':
      case 'error':
        return themeColors.error;
      default:
        return themeColors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 20,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 20,
      backgroundColor: themeColors.surface,
      marginVertical: 10,
      marginHorizontal: 20,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 15,
    },
    testRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    testName: {
      fontSize: 16,
      color: themeColors.text,
      flex: 1,
    },
    testStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '500',
    },
    button: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 10,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    loader: {
      marginVertical: 20,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Collaboration Test Suite</Text>
          <Text style={styles.subtitle}>
            Testing collaboration features and Supabase integration
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integration Tests</Text>
          
          {Object.entries(testResults).map(([test, status]) => (
            <View key={test} style={styles.testRow}>
              <Text style={styles.testName}>
                {test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <View style={styles.testStatus}>
                <Text style={{ fontSize: 18 }}>{getStatusIcon(status)}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                  {status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={runTests}>
            <Text style={styles.buttonText}>Re-run Tests</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: themeColors.success }]}
            onPress={createTestProject}
            disabled={!user || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating...' : 'Create Test Project'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: themeColors.warning, marginTop: 10 }]}
            onPress={() => Alert.alert('User Info', JSON.stringify(user, null, 2))}
          >
            <Text style={styles.buttonText}>Show User Info</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collaboration Hub Component</Text>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} color={themeColors.primary} />
          ) : (
            <CollaborationHub
              projects={projects}
              onProjectPress={(project) => {
                setSelectedProject(project);
                setModalVisible(true);
              }}
              onRefresh={runTests}
              isRefreshing={isLoading}
            />
          )}
        </View>
      </ScrollView>

      {selectedProject && (
        <CollaborationDetailModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectAccepted={(projectId) => {
            console.log('Project accepted:', projectId);
            runTests();
          }}
          onProjectCompleted={(projectId) => {
            console.log('Project completed:', projectId);
            runTests();
          }}
        />
      )}
    </View>
  );
}
