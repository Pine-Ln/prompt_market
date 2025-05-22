import dbConnect from '../../../lib/dbConnect';
import Prompt from '../../../models/Prompt';
import User from '../../../models/User'; 
import { getToken } from 'next-auth/jwt'; 

export default async function handler(req, res) {
  const { method } = req;
  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit;
        
        const query = { status: 'published' }; 
        
        if (req.query.search) {
          const searchRegex = new RegExp(req.query.search, 'i');
          query.$or = [
            { title: searchRegex }, 
            { content: searchRegex }
          ];
        }
        
        if (req.query.title) {
          query.title = { $regex: req.query.title, $options: 'i' };
        }
        
        if (req.query.content) {
          query.content = { $regex: req.query.content, $options: 'i' };
        }
        
        if (req.query.tags) {
          const tags = req.query.tags.split(',').map(tag => tag.trim());
          query.tags = { $in: tags };
        }
        
        if (req.query.authorId) {
          query.author = req.query.authorId;
        }
        
        let sortOption = { createdAt: -1 }; 
        if (req.query.sort) {
          const sortField = req.query.sort.startsWith('-') ? 
            req.query.sort.substring(1) : req.query.sort;
          const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
          sortOption = { [sortField]: sortOrder };
        }
        
        const total = await Prompt.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        
        const prompts = await Prompt.find(query)
          .populate({
            path: 'author',
            select: 'name image email',
          })
          .select('+likedBy') 
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean(); 

        res.status(200).json({ 
          success: true, 
          data: prompts,
          pagination: {
            totalPrompts: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            pageSize: limit,
            hasMore: page * limit < total
          }
        });
      } catch (error) {
        console.error("Error fetching prompts:", error);
        res.status(400).json({ success: false, message: 'Error fetching prompts' });
      }
      break;
    case 'POST':
      try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.sub) {
          return res.status(401).json({ success: false, message: '未认证，无法创建 Prompt' });
        }
        const userId = token.sub;
        console.log('[Create Prompt API] Token details:', JSON.stringify(token, null, 2)); 
        console.log('[Create Prompt API] User ID from token.sub:', userId); 

        const { title, content, tags } = req.body;

        if (!title || !content) {
          return res.status(400).json({ success: false, message: '标题和内容不能为空' });
        }

        const newPrompt = new Prompt({
          title,
          content,
          tags: Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string' && tag.trim() !== '') : [],
          author: userId,
          status: 'pending', 
        });

        await newPrompt.save();
        const populatedPrompt = await Prompt.findById(newPrompt._id).populate('author', 'name image').lean();

        res.status(201).json({ success: true, data: populatedPrompt, message: 'Prompt 创建成功，等待审核' });
      } catch (error) {
        console.error("Error creating prompt:", error);
        if (error.name === 'ValidationError') {
          return res.status(400).json({ success: false, message: '创建失败，请检查输入数据', errors: error.errors });
        }
        res.status(500).json({ success: false, message: '创建 Prompt 失败，服务器内部错误' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
      break;
  }
} 