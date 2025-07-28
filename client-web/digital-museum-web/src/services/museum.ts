import api from './api'

export interface AwardWork {
  _id: string
  title: string
  description: string
  category: string
  year: number
  author: string
  school: string
  images: string[]
  audioUrl?: string
  certificateUrl?: string
  modelUrl?: string
  tags: string[]
  viewCount: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateWorkData {
  title: string
  description: string
  category: string
  year: number
  author: string
  school: string
  tags?: string[]
  status?: string
}

export interface GetWorksParams {
  page?: number
  limit?: number
  category?: string
  year?: number
  keyword?: string
  status?: string
}

export const museumApi = {
  // 获取作品列表
  getWorks: (params: GetWorksParams) =>
    api.get('/api/museum/works', { params }),

  // 获取作品详情
  getWork: (id: string) =>
    api.get(`/api/museum/works/${id}`),

  // 创建作品 - 使用简化版本
  createWork: (data: CreateWorkData) =>
    api.post('/api/museum/works/simple', data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  // 更新作品
  updateWork: (id: string, data: Partial<CreateWorkData>) =>
    api.put(`/api/museum/works/${id}`, data),

  // 删除作品
  deleteWork: (id: string) =>
    api.delete(`/api/museum/works/${id}`),

  // 获取分类
  getCategories: () =>
    api.get('/api/museum/categories'),

  // 搜索作品
  searchWorks: (keyword: string) =>
    api.get('/api/museum/search', { params: { keyword } }),
}