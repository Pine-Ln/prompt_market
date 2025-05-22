import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MdArrowBack } from 'react-icons/md';
import { useSession } from 'next-auth/react';
import styles from '../styles/CreatePrompt.module.css';

export default function CreatePromptPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/create-prompt');
    }
  }, [status, router]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空！');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), 
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || '创建 Prompt 失败');
      }

      setTitle('');
      setContent('');
      setTags('');
      setSuccessMessage(data.message || 'Prompt 创建成功，等待审核！');
      setTimeout(() => {
        router.push('/'); 
      }, 2000); 

    } catch (err) {
      console.error("Create prompt error:", err);
      setError(err.message || '发生未知错误，请稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>加载中...</p>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return null; 
  }
  
  return (
    <>
      <Head>
        <title>创建新提示 | AI提示库</title>
        <meta name="description" content="创建新的AI聊天提示" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            <MdArrowBack />
            <span>返回</span>
          </Link>
          <h1 className={styles.title}>创建新提示</h1>
        </div>
        
        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className={styles.successAlert}>
            <p>{successMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>标题</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入提示标题"
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="content" className={styles.label}>内容</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入提示内容"
              className={styles.textarea}
              rows={8}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="tags" className={styles.label}>标签 (用逗号分隔)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如: AI, 写作, 创意"
              className={styles.input}
            />
          </div>
          
          <div className={styles.actions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => router.push('/')}
            >
              取消
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '创建提示'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic'; 