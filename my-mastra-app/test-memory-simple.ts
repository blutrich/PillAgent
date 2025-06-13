import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

async function testSimpleMemory() {
  console.log('🧠 Testing Simple LibSQL Memory...');
  
  try {
    // Test with LibSQL only (no Upstash)
    const memory = new Memory({
      storage: new LibSQLStore({
        url: "file:./.mastra/output/test-memory.db",
      }),
    });

    console.log('✅ Memory initialized with LibSQL');

    // Test creating a thread
    const thread = await memory.createThread({
      resourceId: 'test-user-123',
      title: 'Test Memory Session',
    });
    
    console.log('✅ Thread created:', thread.id);

    // Test retrieving the thread
    const retrieved = await memory.getThreadById({ threadId: thread.id });
    console.log('✅ Thread retrieved:', retrieved?.title);

    console.log('\n🎉 Basic Memory Test PASSED!');
    
  } catch (error) {
    console.error('❌ Memory Test FAILED:', error);
  }
}

testSimpleMemory(); 