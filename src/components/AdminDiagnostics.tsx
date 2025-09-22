import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Users, Shield } from 'lucide-react';
import { DatabaseDiagnostics, getErrorDescription } from '../utils/diagnostics';

const AdminDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@example.com');

  const runDiagnostics = async () => {
    setLoading(true);
    
    try {
      const results = {
        connection: await DatabaseDiagnostics.testConnection(),
        supabaseStatus: await DatabaseDiagnostics.checkSupabaseStatus(),
        tableStructure: await DatabaseDiagnostics.validateTableStructure(),
        userCreationFlow: await DatabaseDiagnostics.testUserCreationFlow(testEmail),
        timestamp: new Date().toISOString()
      };
      
      setDiagnostics(results);
    } catch (error: any) {
      setDiagnostics({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Database className="h-6 w-6 mr-2" />
          Database Diagnostics
        </h2>
        
        <div className="flex items-center space-x-4">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Test email for user creation"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Run Diagnostics</span>
          </button>
        </div>
      </div>

      {diagnostics && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Connection
            </h3>
            <div className="flex items-center space-x-3">
              {getStatusIcon(diagnostics.connection.success)}
              <span className={`font-medium ${diagnostics.connection.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {diagnostics.connection.success ? 'Connected' : 'Connection Failed'}
              </span>
              {diagnostics.connection.latency && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({diagnostics.connection.latency}ms)
                </span>
              )}
            </div>
            {diagnostics.connection.error && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm">
                {diagnostics.connection.error}
              </div>
            )}
          </div>

          {/* Supabase Status */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Supabase Service Status
            </h3>
            <div className="flex items-center space-x-3">
              {getStatusIcon(diagnostics.supabaseStatus.status === 'healthy')}
              <span className={`font-medium ${diagnostics.supabaseStatus.status === 'healthy' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {diagnostics.supabaseStatus.status}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(diagnostics.supabaseStatus.details, null, 2)}
              </pre>
            </div>
          </div>

          {/* Table Structure */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Database Tables
            </h3>
            <div className="space-y-2">
              {diagnostics.tableStructure.tables.map((table: any) => (
                <div key={table.name} className="flex items-center space-x-3">
                  {getStatusIcon(table.exists)}
                  <span className="font-medium">{table.name}</span>
                  <span className={`text-sm ${table.exists ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {table.exists ? 'Exists' : 'Missing'}
                  </span>
                </div>
              ))}
            </div>
            {diagnostics.tableStructure.issues.length > 0 && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Issues Found:</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                  {diagnostics.tableStructure.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* User Creation Flow Test */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              User Creation Flow Test
            </h3>
            <div className="flex items-center space-x-3 mb-3">
              {getStatusIcon(diagnostics.userCreationFlow.overallSuccess)}
              <span className={`font-medium ${diagnostics.userCreationFlow.overallSuccess ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {diagnostics.userCreationFlow.overallSuccess ? 'All Steps Passed' : 'Issues Found'}
              </span>
            </div>
            <div className="space-y-2">
              {diagnostics.userCreationFlow.steps.map((step: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(step.success)}
                    <span className="font-medium">{step.step}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{step.duration}ms</span>
                    {step.error && (
                      <span className="text-red-600 dark:text-red-400 max-w-xs truncate">
                        {step.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Last run: {new Date(diagnostics.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {!diagnostics && !loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>Click "Run Diagnostics" to check database health and user creation flow</p>
        </div>
      )}
    </div>
  );
};

export default AdminDiagnostics;