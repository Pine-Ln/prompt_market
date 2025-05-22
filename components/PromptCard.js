import Link from 'next/link';
import LikeButton from './LikeButton'; // 假设 LikeButton 在同级目录或相应调整
import styles from '../styles/PromptCard.module.css'; // 导入 CSS 模块
import { useState, useEffect } from 'react'; // 引入 useState 和 useEffect
import { MdContentCopy, MdCheck, MdEdit, MdDelete, MdThumbUp, MdVisibility } from 'react-icons/md';
import SafeMarkdown from './SafeMarkdown';

export default function PromptCard({ prompt, currentUserId }) {
  if (!prompt) return null; // 添加一个保护，防止 prompt 未定义

  const [copied, setCopied] = useState(false); // 状态追踪复制操作
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // 在客户端渲染后设置 isClient 为 true
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isAuthor = currentUserId && prompt.author?._id === currentUserId;

  const copyToClipboard = () => {
    if (!prompt.content || !isClient) return;
    
    try {
      // 检查剪贴板API是否可用
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // 备用方法
        const textArea = document.createElement('textarea');
        textArea.value = prompt.content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '未知时间';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '无效日期';
    
    const now = new Date();
    const diff = now - date; // 毫秒差
    
    // 转换为秒、分钟、小时、天
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    // 根据时间差显示不同格式
    if (seconds < 60) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      // 超过7天，显示具体日期
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const formattedDate = prompt.createdAt ? formatDate(prompt.createdAt) : '未知时间';

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        const response = await fetch(`/api/prompts/${prompt._id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // 可以使用一个回调通知父组件进行刷新
          window.location.reload(); // 临时解决方案，实际应使用状态管理
        } else {
          console.error('删除失败');
        }
      } catch (error) {
        console.error('删除出错:', error);
      }
    } else {
      setConfirmDelete(true);
      // 5秒后重置确认状态
      setTimeout(() => setConfirmDelete(false), 5000);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.authorInfo}>
          {prompt.author?.image && (
            <img 
              src={prompt.author.image} 
              alt={prompt.author.name || '用户头像'} 
              className={styles.authorImage}
            />
          )}
          <div className={styles.authorText}>
            <h3 className={styles.authorName}>{prompt.author?.name || '匿名用户'}</h3>
            <p className={styles.promptDate}>{formattedDate}</p>
          </div>
        </div>
        {isClient && (
          <button
            onClick={copyToClipboard}
            className={styles.copyButton}
            title="复制内容"
          >
            {copied ? <MdCheck size={18} /> : <MdContentCopy size={18} />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        )}
      </div>
      
      <div className={styles.cardContent}>
        <Link href={`/prompt/${prompt._id}`} className={styles.promptLink}>
          <h2 className={styles.promptTitle}>{prompt.title}</h2>
        </Link>
        
        <div className={styles.promptContent}>
          <SafeMarkdown content={prompt.content} />
        </div>
        
        {/* 标签和价格 */}
        <div className={styles.tagsAndPrice}>
          {prompt.tags && prompt.tags.length > 0 && (
            <div className={styles.tags}>
              {prompt.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}
          
          {prompt.price > 0 && (
            <div className={styles.price}>¥{prompt.price}</div>
          )}
        </div>
        
        <div className={styles.cardFooter}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <MdThumbUp className={styles.statIcon} />
              <span className={styles.statValue}>{prompt.likesCount || 0}</span>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.statItem}>
              <MdVisibility className={styles.statIcon} />
              <span className={styles.statValue}>{prompt.viewCount || 0}</span>
            </div>
          </div>
          
          <Link href={`/prompt/${prompt._id}`} className={styles.detailsLink}>
            查看详情
          </Link>
        </div>
      </div>
      
      {isAuthor && (
        <div className={styles.actions}>
          <Link href={`/edit-prompt/${prompt._id}`} className={styles.editButton}>
            <MdEdit size={18} />
            <span>编辑</span>
          </Link>
          
          <button 
            onClick={handleDelete} 
            className={`${styles.deleteButton} ${confirmDelete ? styles.confirm : ''}`}
          >
            <MdDelete size={18} />
            <span>{confirmDelete ? '确认删除?' : '删除'}</span>
          </button>
        </div>
      )}
    </div>
  );
} 