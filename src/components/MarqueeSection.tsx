import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { CircularGalleryItem } from './CircularGallery'
import { assetPath } from '../utils/assets'

const CircularGallery = lazy(() => import('./CircularGallery').then((module) => ({
  default: module.CircularGallery,
})))

const galleryItems: CircularGalleryItem[] = [
  {
    image: assetPath('editorial/job-assistant-scene.webp'),
    text: '深圳 AI 求职助手 / 从岗位噪声到人工确认',
    alt: '岗位资料经过整理、判断、排序和人工确认形成可追踪工作流',
  },
  {
    image: assetPath('editorial/xiaoyu-scene.webp'),
    text: '小u鱼 / 低打扰陪伴与可控动作',
    alt: '小u鱼桌宠围绕专注、计时、提醒和锁定提供低打扰陪伴',
  },
  {
    image: assetPath('editorial/rag-knowledge-scene.webp'),
    text: 'RAG 知识库 / 来源、检索与带引用回答',
    alt: '本地文档进入混合检索链路后生成带引用来源的回答',
  },
  {
    image: assetPath('cover/slumber-wake-transition-1280.webp'),
    text: 'Slumber / Wake / 从休眠到开始创造',
    alt: '睡醒实验室角色从昏暗睡眠空间走向明亮创作工作台',
  },
  {
    image: assetPath('editorial/experiments-workbench.webp'),
    text: 'Field Notes / 实验、验证与归档',
    alt: '实验工作台与验证归档架组成持续迭代的项目现场',
  },
  {
    image: assetPath('editorial/contact-conversation.webp'),
    text: 'Wake something up / 从消息到协作',
    alt: '创作者收到消息后通过沟通建立联系并开始协作',
  },
]

export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [galleryReady, setGalleryReady] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || typeof window.IntersectionObserver === 'undefined') {
      setGalleryReady(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setGalleryReady(true)
        observer.disconnect()
      }
    }, { rootMargin: '360px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="marquee-section" ref={sectionRef} aria-labelledby="gallery-title">
      <header className="marquee-section__heading">
        <p>PROJECTS / EVIDENCE REEL</p>
        <h2 id="gallery-title">Scenes from<br />the lab.</h2>
        <span>彩色项目场景自动轮播。向下滚动时画面向右，向上滚动时画面向左。</span>
      </header>
      {galleryReady ? (
        <Suspense fallback={<div className="circular-gallery-shell"><div className="circular-gallery__loading" /></div>}>
          <CircularGallery items={galleryItems} bend={2.8} scrollEase={0.055} autoSpeed={0.42} />
        </Suspense>
      ) : (
        <div className="circular-gallery-shell" aria-hidden="true">
          <div className="circular-gallery__loading" />
        </div>
      )}
    </section>
  )
}
