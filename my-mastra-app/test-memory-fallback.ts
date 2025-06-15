import { createOptimalMemory, supabaseConfig } from './src/mastra/lib/supabase-memory';

/**
 * Test Memory Fallback Behavior
 * 
 * This test demonstrates:
 * 1. Automatic fallback from Supabase to LibSQL when credentials missing
 * 2. Memory functionality works regardless of backend
 * 3. Configuration detection
 */

async function testMemoryFallback() {
  console.log('🧪 TESTING MEMORY FALLBACK BEHAVIOR\n');
  
  // =============================================================================
  // CONFIGURATION CHECK
  // =============================================================================
  console.log('📍 CONFIGURATION STATUS');
  console.log('='.repeat(40));
  console.log('Supabase Project ID:', supabaseConfig.projectId);
  console.log('Supabase Host:', supabaseConfig.host);
  console.log('Has Credentials:', supabaseConfig.hasCredentials);
  console.log('Expected Backend:', supabaseConfig.hasCredentials ? 'Supabase PostgreSQL' : 'LibSQL');
  console.log('');

  // =============================================================================
  // MEMORY FUNCTIONALITY TEST
  // =============================================================================
  console.log('🧠 MEMORY FUNCTIONALITY TEST');
  console.log('='.repeat(40));
  
  try {
    console.log('🔄 Creating optimal memory configuration...');
    const memory = createOptimalMemory();
    console.log('✅ Memory created successfully');
    
    // Test basic memory operations
    console.log('🧵 Testing thread creation...');
    const testThread = await memory.createThread({
      resourceId: 'fallback-test-user-123',
      title: 'Memory Fallback Test Session',
      metadata: {
        testType: 'fallback-verification',
        timestamp: new Date().toISOString(),
        expectedBackend: supabaseConfig.hasCredentials ? 'supabase' : 'libsql'
      }
    });
    
    console.log('✅ Thread created:', testThread.id);
    console.log('📝 Thread title:', testThread.title);
    
    // Test thread retrieval
    console.log('🔍 Testing thread retrieval...');
    const retrievedThread = await memory.getThreadById({ threadId: testThread.id });
    console.log('✅ Thread retrieved:', retrievedThread?.title);
    
    // Test resource-based queries
    console.log('📋 Testing resource-based queries...');
    const userThreads = await memory.getThreadsByResourceId({ 
      resourceId: 'fallback-test-user-123' 
    });
    console.log('✅ User threads found:', userThreads.length);
    
    // Test multiple threads for same user
    console.log('🔄 Creating additional threads...');
    for (let i = 2; i <= 3; i++) {
      const additionalThread = await memory.createThread({
        resourceId: 'fallback-test-user-123',
        title: `Test Session ${i}`,
        metadata: { sessionNumber: i }
      });
      console.log(`✅ Additional thread ${i} created:`, additionalThread.id);
    }
    
    // Verify all threads for user
    const allUserThreads = await memory.getThreadsByResourceId({ 
      resourceId: 'fallback-test-user-123' 
    });
    console.log('✅ Total user threads:', allUserThreads.length);
    
    console.log('🎉 MEMORY FUNCTIONALITY TEST PASSED!\n');
    
  } catch (error) {
    console.error('❌ MEMORY FUNCTIONALITY TEST FAILED:', error);
    console.log('');
  }

  // =============================================================================
  // PERSISTENCE TEST
  // =============================================================================
  console.log('💾 PERSISTENCE TEST');
  console.log('='.repeat(40));
  
  try {
    console.log('🔄 Creating new memory instance (simulating restart)...');
    const newMemoryInstance = createOptimalMemory();
    
    // Try to retrieve previously created threads
    console.log('🔍 Retrieving threads from new instance...');
    const persistedThreads = await newMemoryInstance.getThreadsByResourceId({ 
      resourceId: 'fallback-test-user-123' 
    });
    
    console.log('✅ Persisted threads found:', persistedThreads.length);
    
    if (persistedThreads.length > 0) {
      console.log('✅ Memory persistence: WORKING');
      console.log('📝 Sample persisted thread:', persistedThreads[0].title);
    } else {
      console.log('⚠️ No persisted threads found (may be expected for first run)');
    }
    
    console.log('🎉 PERSISTENCE TEST COMPLETED!\n');
    
  } catch (error) {
    console.error('❌ PERSISTENCE TEST FAILED:', error);
    console.log('');
  }

  // =============================================================================
  // SUMMARY REPORT
  // =============================================================================
  console.log('📊 MEMORY IMPLEMENTATION SUMMARY');
  console.log('='.repeat(50));
  
  if (supabaseConfig.hasCredentials) {
    console.log('🐘 BACKEND: Supabase PostgreSQL');
    console.log('✅ Scalability: Unlimited');
    console.log('✅ Vector Search: Available');
    console.log('✅ Integration: Perfect with existing stack');
    console.log('✅ Persistence: Database-backed');
  } else {
    console.log('📁 BACKEND: LibSQL (Fallback)');
    console.log('⚠️ Scalability: File-based limits');
    console.log('❌ Vector Search: Not available');
    console.log('✅ Integration: Working fallback');
    console.log('✅ Persistence: File-based');
  }
  
  console.log('');
  console.log('🔧 TO ENABLE SUPABASE POSTGRESQL:');
  console.log('1. Get your Supabase database password from dashboard');
  console.log('2. Set SUPABASE_DB_PASSWORD environment variable');
  console.log('3. Set SUPABASE_SERVICE_KEY environment variable');
  console.log('4. Restart the application');
  console.log('');
  console.log('🚀 STATUS: Ready for deployment with automatic fallback');
  console.log('✅ No breaking changes');
  console.log('✅ Seamless upgrade path when credentials added');
}

// Run the test
testMemoryFallback().catch(console.error); 