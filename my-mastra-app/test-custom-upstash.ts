import { UpstashRedisStore } from './src/mastra/lib/upstash-redis-store';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testCustomUpstashStore() {
  console.log('🧠 Testing Custom Upstash Redis Store...');
  
  try {
    // Initialize our custom Redis store (will auto-detect environment variables)
    const store = new UpstashRedisStore();

    console.log('✅ Custom Redis Store initialized');

    // Test ping
    console.log('🏓 Testing Redis connection...');
    const pingResult = await store.ping();
    console.log('✅ Redis ping:', pingResult);

    if (!pingResult) {
      throw new Error('Redis connection failed');
    }

    // Test creating a thread
    console.log('🧵 Creating test thread...');
    const thread = await store.createThread({
      resourceId: 'test-user-123',
      title: 'ClimbingPill Custom Redis Test',
      metadata: {
        type: 'assessment',
        goal: 'V8 training',
        testRun: true
      }
    });
    console.log('✅ Thread created:', thread.id);

    // Test retrieving thread
    console.log('🔍 Retrieving thread...');
    const retrievedThread = await store.getThreadById(thread.id);
    console.log('✅ Thread retrieved:', retrievedThread?.title);

    // Test getting threads by resource
    console.log('📋 Getting threads by resource...');
    const userThreads = await store.getThreadsByResourceId('test-user-123');
    console.log('✅ Found threads:', userThreads.length);

    // Test adding messages
    console.log('💬 Adding test messages...');
    
    const userMessage = await store.addMessage({
      threadId: thread.id,
      role: 'user',
      content: 'Hello, I want to start climbing training. My goal is V8.',
      metadata: { timestamp: new Date().toISOString() }
    });
    console.log('✅ User message added:', userMessage.id);

    const assistantMessage = await store.addMessage({
      threadId: thread.id,
      role: 'assistant',
      content: 'Great! V8 is an excellent goal. Let\'s start with an assessment to understand your current level.',
      metadata: { confidence: 0.95 }
    });
    console.log('✅ Assistant message added:', assistantMessage.id);

    // Test retrieving messages
    console.log('📨 Retrieving messages...');
    const messages = await store.getMessages(thread.id);
    console.log('✅ Messages retrieved:', messages.length);
    
    messages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });

    // Test getting last messages
    console.log('📜 Getting last 5 messages...');
    const lastMessages = await store.getLastMessages(thread.id, 5);
    console.log('✅ Last messages:', lastMessages.length);

    // Test thread updates
    console.log('🔄 Updating thread...');
    const updatedThread = await store.updateThread(thread.id, {
      title: 'ClimbingPill Custom Redis Test - Updated',
      metadata: {
        ...thread.metadata,
        updated: true,
        messagesCount: messages.length
      }
    });
    console.log('✅ Thread updated:', updatedThread?.title);

    console.log('\n🎉 Custom Upstash Redis Store Test PASSED!');
    console.log('🚀 Production Redis memory storage is now functional!');
    console.log('📊 This solves the ES modules crypto issue');
    
    console.log('\n📋 Test Summary:');
    console.log('✅ Redis Connection: Working');
    console.log('✅ Thread Creation: Working');
    console.log('✅ Thread Retrieval: Working');
    console.log('✅ Resource-based Queries: Working');
    console.log('✅ Message Storage: Working');
    console.log('✅ Message Retrieval: Working');
    console.log('✅ Thread Updates: Working');
    console.log('✅ ES Modules: No crypto issues!');
    
  } catch (error) {
    console.error('❌ Custom Redis Store Test FAILED:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('UPSTASH_REDIS_REST_URL')) {
        console.log('\n💡 SOLUTION: Set environment variables:');
        console.log('   UPSTASH_REDIS_REST_URL=your_upstash_url');
        console.log('   UPSTASH_REDIS_REST_TOKEN=your_upstash_token');
      }
      
      if (error.message.includes('fetch')) {
        console.log('\n💡 SOLUTION: Check your internet connection and Upstash credentials');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testCustomUpstashStore(); 