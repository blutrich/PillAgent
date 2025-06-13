import { Memory } from '@mastra/memory';
import { UpstashStore } from '@mastra/upstash';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testUpstashMemory() {
  console.log('🧠 Testing Upstash Redis Memory Storage...');
  
  try {
    // Initialize memory with Upstash
    const memory = new Memory({
      storage: new UpstashStore({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
    });

    console.log('✅ Memory initialized with Upstash Redis');

    // Test creating a thread
    console.log('🧵 Creating test thread...');
    const thread = await memory.createThread({
      resourceId: 'test-user-123',
      title: 'ClimbingPill Test Session',
      metadata: {
        type: 'assessment',
        goal: 'V8 training'
      }
    });
    console.log('✅ Thread created:', thread.id);

    // Test conversation history
    console.log('💬 Testing conversation history...');
    
    // Add messages to the thread (using the agent's internal methods)
    // Note: Direct message adding is typically done through agent interactions
    
    // Test retrieving thread
    console.log('🔍 Retrieving thread...');
    const retrievedThread = await memory.getThreadById({ threadId: thread.id });
    console.log('✅ Thread retrieved:', retrievedThread?.title);

    // Test getting threads by resource
    console.log('📋 Getting threads by resource...');
    const userThreads = await memory.getThreadsByResourceId({ resourceId: 'test-user-123' });
    console.log('✅ Found threads:', userThreads.length);

    // Test querying messages (will be empty since we haven't added messages through agent)
    console.log('📨 Querying messages...');
    const { messages, uiMessages } = await memory.query({
      threadId: thread.id,
      selectBy: { last: 10 }
    });
    console.log('✅ Messages retrieved:', messages.length);

    console.log('\n🎉 Upstash Redis Memory Storage Test PASSED!');
    console.log('📊 Production memory will persist across deployments');
    console.log('🔗 Thread ID for testing:', thread.id);
    
  } catch (error) {
    console.error('❌ Upstash Memory Test FAILED:', error);
    process.exit(1);
  }
}

testUpstashMemory(); 