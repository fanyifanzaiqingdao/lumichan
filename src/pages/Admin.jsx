import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import defaultHomepage from '../data/homepage.js'
import './Admin.css'

const AUTH_API = '/api/admin-auth.php'
const PRODUCTS_API = '/api/admin-products.php'
const GUIDES_API = '/api/admin-guides.php'
const HOMEPAGE_API = '/api/admin-homepage.php'
const LEADS_API = '/api/admin-leads.php'
const INQUIRIES_API = '/api/admin-inquiries.php'
const UPLOAD_API = '/api/admin-upload.php'

const EMPTY_PRODUCT = {
  id: '',
  title: '',
  subtitle: '',
  description: '',
  duration: '',
  price: '',
  rating: 5,
  review_count: 0,
  max_altitude: '',
  group_size: '',
  highlights: '',
  image: '',
  sort_order: 0,
  is_published: true,
}

const EMPTY_GUIDE = {
  id: '',
  full_name: '',
  email: '',
  phone: '',
  location: '',
  photo_url: '',
  has_vehicle: false,
  vehicle_type: '',
  vehicle_plate: '',
  languages: '',
  specialties: '',
  experience: '',
  bio: '',
  price_per_day: 100,
  rating: 5,
  reviews_count: 0,
  status: 'pending',
  admin_notes: '',
}

const STATUS_LABEL = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

const LEAD_STATUS_LABEL = {
  new: '新线索',
  reviewing: '评估中',
  drafted: '已有草稿',
  posted: '已人工发布',
  replied: '有回复',
  ignored: '忽略',
}

const EMPTY_LEAD = {
  platform: 'Reddit',
  keyword: '',
  title: '',
  url: '',
  summary: '',
  author: '',
  status: 'new',
  score: 0,
  admin_notes: '',
  reply_draft: '',
}

function isSearchPageUrl(url = '') {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'google.com' || host === 'duckduckgo.com') return true
    if (host === 'reddit.com' && parsed.pathname.startsWith('/search')) return true
    if (host === 'tripadvisor.com' && parsed.pathname.startsWith('/Search')) return true
    if (host === 'quora.com' && parsed.pathname.startsWith('/search')) return true
    if (host === 'youtube.com' && parsed.pathname.startsWith('/results')) return true
    return false
  } catch {
    return false
  }
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `请求失败 (${res.status})`)
  }
  return json
}

export default function Admin() {
  const [booting, setBooting] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState('homepage') // homepage | products | guides | leads
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [products, setProducts] = useState([])
  const [productEditing, setProductEditing] = useState(null)
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [productQuery, setProductQuery] = useState('')

  const [guides, setGuides] = useState([])
  const [guideCounts, setGuideCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 })
  const [guideStatus, setGuideStatus] = useState('all')
  const [guideEditing, setGuideEditing] = useState(null)
  const [guideForm, setGuideForm] = useState(EMPTY_GUIDE)
  const [guideQuery, setGuideQuery] = useState('')
  const [homepage, setHomepage] = useState(null)
  const [inquiries, setInquiries] = useState([])
  const [homepageSaved, setHomepageSaved] = useState(false)
  const [leadKeywords, setLeadKeywords] = useState('')
  const [leadLinks, setLeadLinks] = useState([])
  const [leads, setLeads] = useState([])
  const [leadQuery, setLeadQuery] = useState('')
  const [leadStatus, setLeadStatus] = useState('all')
  const [leadEditing, setLeadEditing] = useState(null)
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD)
  const [deepseekConfigured, setDeepseekConfigured] = useState(false)
  const [leadDiscovering, setLeadDiscovering] = useState(false)
  const [leadDiscoverResults, setLeadDiscoverResults] = useState([])

  async function refreshSession() {
    const data = await api(`${AUTH_API}?action=me`)
    setLoggedIn(!!data.logged_in)
    return !!data.logged_in
  }

  async function loadProducts() {
    const data = await api(PRODUCTS_API)
    setProducts(data.products || [])
  }

  async function loadGuides(status = guideStatus) {
    const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''
    const data = await api(`${GUIDES_API}${q}`)
    setGuides(data.guides || [])
    setGuideCounts(data.counts || { all: 0, pending: 0, approved: 0, rejected: 0 })
  }

  async function loadHomepage() {
    const data = await api(HOMEPAGE_API)
    const saved = data.homepage || {}
    setHomepage({
      ...defaultHomepage,
      ...saved,
      copy: { ...defaultHomepage.copy, ...saved.copy },
      formConfig: { ...defaultHomepage.formConfig, ...saved.formConfig },
      services: defaultHomepage.services.map((item, index) => ({ ...item, ...(saved.services?.[index] || {}) })),
      journeys: defaultHomepage.journeys.map((item, index) => ({ ...item, ...(saved.journeys?.[index] || {}) })),
      whyImageAlt: saved.whyImageAlt || defaultHomepage.whyImageAlt,
      vlogs: saved.vlogs || [],
      reviews: saved.reviews || [],
    })
  }

  async function loadInquiries() {
    const data = await api(INQUIRIES_API)
    setInquiries(data.inquiries || [])
  }

  async function loadLeads() {
    const data = await api(LEADS_API)
    setLeadKeywords((data.keywords || []).join('\n'))
    setLeadLinks(data.search_links || [])
    setLeads(data.leads || [])
    setDeepseekConfigured(!!data.deepseek_configured)
  }

  async function loadAll() {
    await Promise.all([loadHomepage(), loadProducts(), loadGuides(guideStatus), loadLeads()])
  }

  useEffect(() => {
    ;(async () => {
      try {
        const ok = await refreshSession()
        if (ok) await loadAll()
      } catch (err) {
        setError(err.message)
      } finally {
        setBooting(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.subtitle || '').toLowerCase().includes(q) ||
        (p.price || '').toLowerCase().includes(q),
    )
  }, [products, productQuery])

  const filteredGuides = useMemo(() => {
    const q = guideQuery.trim().toLowerCase()
    if (!q) return guides
    return guides.filter(
      (g) =>
        (g.full_name || '').toLowerCase().includes(q) ||
        (g.location || '').toLowerCase().includes(q) ||
        (g.email || '').toLowerCase().includes(q),
    )
  }, [guides, guideQuery])

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase()
    return leads.filter((lead) => {
      if (leadStatus !== 'all' && lead.status !== leadStatus) return false
      if (!q) return true
      return [lead.title, lead.platform, lead.keyword, lead.summary, lead.url, lead.author]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [leads, leadQuery, leadStatus])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      await api(AUTH_API, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', password }),
      })
      setLoggedIn(true)
      setPassword('')
      await loadAll()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleLogout() {
    await api(AUTH_API, { method: 'POST', body: JSON.stringify({ action: 'logout' }) })
    setLoggedIn(false)
    setProducts([])
    setGuides([])
    setHomepage(null)
  }

  async function saveHomepage() {
    setSaving(true)
    setError('')
    try {
      const data = await api(HOMEPAGE_API, {
        method: 'PUT',
        body: JSON.stringify({ homepage }),
      })
      setHomepage(data.homepage || homepage)
      setHomepageSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function updateHomepage(path, value) {
    setHomepageSaved(false)
    setHomepage((current) => {
      const next = structuredClone(current || {})
      let target = next
      path.slice(0, -1).forEach((key) => {
        if (target[key] == null) target[key] = typeof key === 'number' ? [] : {}
        target = target[key]
      })
      target[path.at(-1)] = value
      return next
    })
  }

  function updateHomepageList(path, value) {
    updateHomepage(
      path,
      value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    )
  }

  function updateHomepagePairList(path, value) {
    updateHomepage(
      path,
      value
        .split('\n')
        .map((line) => line.split('|').map((item) => item.trim()))
        .filter((items) => items[0] || items[1]),
    )
  }

  function updateHomepageGallery(path, value) {
    updateHomepage(path, value.split('\n').map((line) => {
      const [src, alt] = line.split('|').map((part) => part.trim())
      return { src, alt }
    }).filter((item) => item.src || item.alt))
  }

  function addHomepageItem(key, item) {
    updateHomepage([key], [...(homepage?.[key] || []), item])
  }

  function removeHomepageItem(key, index) {
    updateHomepage([key], homepage[key].filter((_, itemIndex) => itemIndex !== index))
  }

  async function uploadHomepageImage(file, path) {
    if (!file) return
    setSaving(true)
    setError('')
    try {
      const body = new FormData()
      body.append('image', file)
      const response = await fetch(UPLOAD_API, { method: 'POST', credentials: 'include', body })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) throw new Error(result.error || '图片上传失败')
      updateHomepage(path, result.path)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function changeGuideFilter(status) {
    setGuideStatus(status)
    setError('')
    try {
      await loadGuides(status)
    } catch (err) {
      setError(err.message)
    }
  }

  /* —— products —— */
  function openCreateProduct() {
    setProductForm({ ...EMPTY_PRODUCT, sort_order: (products.at(-1)?.sort_order || 0) + 1 })
    setProductEditing('new')
    setError('')
  }

  function openEditProduct(product) {
    setProductForm({
      id: product.id,
      title: product.title || '',
      subtitle: product.subtitle || '',
      description: product.description || '',
      duration: product.duration || '',
      price: product.price || '',
      rating: product.rating ?? 5,
      review_count: product.review_count ?? 0,
      max_altitude: product.max_altitude || '',
      group_size: product.group_size || '',
      highlights: Array.isArray(product.highlights) ? product.highlights.join('\n') : '',
      image: product.image || '',
      sort_order: product.sort_order ?? 0,
      is_published: !!product.is_published,
    })
    setProductEditing(product)
    setError('')
  }

  async function saveProduct(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...productForm,
      rating: Number(productForm.rating) || 0,
      review_count: Number(productForm.review_count) || 0,
      sort_order: Number(productForm.sort_order) || 0,
      highlights: productForm.highlights,
      is_published: !!productForm.is_published,
    }
    try {
      if (productEditing === 'new') {
        await api(PRODUCTS_API, { method: 'POST', body: JSON.stringify(payload) })
      } else {
        await api(`${PRODUCTS_API}?id=${encodeURIComponent(productForm.id)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }
      setProductEditing(null)
      await loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(product) {
    setError('')
    try {
      await api(`${PRODUCTS_API}?id=${encodeURIComponent(product.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ id: product.id, is_published: !product.is_published }),
      })
      await loadProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeProduct(product) {
    if (!confirm(`确定删除「${product.title}」？`)) return
    setError('')
    try {
      await api(`${PRODUCTS_API}?id=${encodeURIComponent(product.id)}`, { method: 'DELETE' })
      await loadProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  /* —— guides —— */
  function openCreateGuide() {
    setGuideForm({ ...EMPTY_GUIDE })
    setGuideEditing('new')
    setError('')
  }

  function openEditGuide(guide) {
    setGuideForm({
      id: guide.id,
      full_name: guide.full_name || '',
      email: guide.email || '',
      phone: guide.phone || '',
      location: guide.location || '',
      photo_url: guide.photo_url || '',
      has_vehicle: !!guide.has_vehicle,
      vehicle_type: guide.vehicle_type || '',
      vehicle_plate: guide.vehicle_plate || '',
      languages: Array.isArray(guide.languages) ? guide.languages.join(', ') : '',
      specialties: Array.isArray(guide.specialties) ? guide.specialties.join(', ') : '',
      experience: guide.experience || '',
      bio: guide.bio || '',
      price_per_day: guide.price_per_day ?? 100,
      rating: guide.rating ?? 5,
      reviews_count: guide.reviews_count ?? 0,
      status: guide.status || 'pending',
      admin_notes: guide.admin_notes || '',
      id_document_url: guide.id_document_url || '',
      vehicle_photo_url: guide.vehicle_photo_url || '',
      insurance_document_url: guide.insurance_document_url || '',
      intro_video_url: guide.intro_video_url || '',
    })
    setGuideEditing(guide)
    setError('')
  }

  async function saveGuide(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...guideForm,
      price_per_day: guideForm.price_per_day === '' ? null : Number(guideForm.price_per_day),
      rating: Number(guideForm.rating) || 5,
      reviews_count: Number(guideForm.reviews_count) || 0,
      has_vehicle: !!guideForm.has_vehicle,
      languages: guideForm.languages,
      specialties: guideForm.specialties,
    }
    try {
      if (guideEditing === 'new') {
        await api(GUIDES_API, { method: 'POST', body: JSON.stringify(payload) })
      } else {
        await api(`${GUIDES_API}?id=${encodeURIComponent(guideForm.id)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }
      setGuideEditing(null)
      await loadGuides(guideStatus)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function setGuideStatusQuick(guide, status) {
    setError('')
    try {
      await api(`${GUIDES_API}?id=${encodeURIComponent(guide.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          id: guide.id,
          status,
          admin_notes: guide.admin_notes || '',
          price_per_day: guide.price_per_day,
        }),
      })
      await loadGuides(guideStatus)
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeGuide(guide) {
    if (!confirm(`确定删除向导「${guide.full_name}」？此操作不可撤销。`)) return
    setError('')
    try {
      await api(`${GUIDES_API}?id=${encodeURIComponent(guide.id)}`, { method: 'DELETE' })
      await loadGuides(guideStatus)
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveLeadKeywords() {
    setSaving(true)
    setError('')
    try {
      const data = await api(LEADS_API, {
        method: 'POST',
        body: JSON.stringify({ action: 'keywords', keywords: leadKeywords }),
      })
      setLeadKeywords((data.keywords || []).join('\n'))
      setLeadLinks(data.search_links || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function discoverLeadPages() {
    setLeadDiscovering(true)
    setError('')
    try {
      const data = await api(LEADS_API, {
        method: 'POST',
        body: JSON.stringify({ action: 'discover', keywords: leadKeywords }),
      })
      setLeadDiscoverResults(data.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLeadDiscovering(false)
    }
  }

  function openCreateLead(link = null) {
    const candidateUrl = link?.resultUrl || link?.url || ''
    setLeadForm({
      ...EMPTY_LEAD,
      platform: link?.platform || 'Reddit',
      keyword: link?.keyword || '',
      title: link?.title || '',
      url: candidateUrl && !isSearchPageUrl(candidateUrl) ? candidateUrl : '',
    })
    setLeadEditing('new')
    setError('')
  }

  function openEditLead(lead) {
    setLeadForm({ ...EMPTY_LEAD, ...lead })
    setLeadEditing(lead)
    setError('')
  }

  async function saveLead(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (leadEditing === 'new') {
        await api(LEADS_API, { method: 'POST', body: JSON.stringify(leadForm) })
      } else {
        await api(`${LEADS_API}?id=${encodeURIComponent(leadForm.id)}`, {
          method: 'PUT',
          body: JSON.stringify(leadForm),
        })
      }
      setLeadEditing(null)
      await loadLeads()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateLead(lead, patch) {
    setError('')
    try {
      await api(`${LEADS_API}?id=${encodeURIComponent(lead.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...lead, ...patch }),
      })
      await loadLeads()
    } catch (err) {
      setError(err.message)
    }
  }

  async function generateLeadDraft(lead) {
    setSaving(true)
    setError('')
    try {
      const data = await api(LEADS_API, {
        method: 'POST',
        body: JSON.stringify({ action: 'draft', id: lead.id }),
      })
      setLeadForm((form) => (form.id === lead.id ? { ...form, ...data.lead } : form))
      await loadLeads()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeLead(lead) {
    if (!confirm(`确定删除线索「${lead.title || lead.url}」？`)) return
    setError('')
    try {
      await api(`${LEADS_API}?id=${encodeURIComponent(lead.id)}`, { method: 'DELETE' })
      await loadLeads()
    } catch (err) {
      setError(err.message)
    }
  }

  if (booting) {
    return (
      <div className="admin-page">
        <p className="admin-muted">加载中…</p>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="admin-page admin-page--login">
        <form className="admin-login" onSubmit={handleLogin}>
          <h1 className="font-serif">Lumichan 后台</h1>
          <p>管理首页、行程产品与向导审核</p>
          <label>
            管理密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="config.php 里的 admin_password"
              required
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="btn btn-gold">
            登录
          </button>
          <Link to="/traveler" className="admin-back">
            ← 返回前台
          </Link>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-top">
        <div>
          <h1 className="font-serif">运营后台</h1>
          <p className="admin-muted">首页配置 · 产品上架 · 向导审核 · 旅游线索</p>
        </div>
        <div className="admin-top__actions">
          <Link
            to={tab === 'homepage' ? '/traveler' : tab === 'guides' ? '/traveler/guides' : '/traveler/itineraries'}
            className="btn btn-outline"
          >
            查看前台
          </Link>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            退出
          </button>
          {tab === 'products' ? (
            <button type="button" className="btn btn-gold" onClick={openCreateProduct}>
              + 新建产品
            </button>
          ) : tab === 'guides' ? (
            <button type="button" className="btn btn-gold" onClick={openCreateGuide}>
              + 新建向导
            </button>
          ) : tab === 'leads' ? (
            <button type="button" className="btn btn-gold" onClick={() => openCreateLead()}>
              + 导入线索
            </button>
          ) : (
            <button type="button" className="btn btn-gold" disabled={saving} onClick={saveHomepage}>
              {saving ? '保存中…' : '保存首页配置'}
            </button>
          )}
        </div>
      </header>

      <div className="admin-tabs">
        <button type="button" className={tab === 'homepage' ? 'is-active' : ''} onClick={() => setTab('homepage')}>
          首页配置
        </button>
        <button type="button" className={tab === 'inquiries' ? 'is-active' : ''} onClick={() => { setTab('inquiries'); loadInquiries().catch((err) => setError(err.message)) }}>
          咨询线索
        </button>
        <button type="button" className={tab === 'products' ? 'is-active' : ''} onClick={() => setTab('products')}>
          产品管理
        </button>
        <button type="button" className={tab === 'guides' ? 'is-active' : ''} onClick={() => setTab('guides')}>
          向导管理
          {guideCounts.pending > 0 && <span className="admin-tab-badge">{guideCounts.pending}</span>}
        </button>
        <button type="button" className={tab === 'leads' ? 'is-active' : ''} onClick={() => setTab('leads')}>
          旅游线索
          {leads.filter((lead) => lead.status === 'new').length > 0 && (
            <span className="admin-tab-badge">{leads.filter((lead) => lead.status === 'new').length}</span>
          )}
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {tab === 'homepage' && (
        <section className="admin-homepage-editor">
          <div className="admin-toolbar">
            <div>
              <strong>首页表单配置</strong>
              <p className="admin-muted">编辑首页文案、图片路径、服务卡片、旅程卡片、步骤和 FAQ。保存后刷新前台生效。</p>
            </div>
            <button type="button" className="btn btn-outline" onClick={loadHomepage}>
              重新加载
            </button>
          </div>

          {homepage && (
            <div className="admin-home-form">
              <div className="admin-home-card">
                <h2 className="font-serif">SEO / 页面文案</h2>
                <div className="admin-form-grid">
                  <label className="span-2">SEO 标题
                    <input maxLength={80} value={homepage.seo?.title || ''} onChange={(e) => updateHomepage(['seo', 'title'], e.target.value)} />
                  </label>
                  <label className="span-2">SEO 描述
                    <textarea rows={2} maxLength={180} value={homepage.seo?.description || ''} onChange={(e) => updateHomepage(['seo', 'description'], e.target.value)} />
                  </label>
                  {Object.entries(homepage.copy || {}).map(([section, fields]) => (
                    <div className="admin-home-repeat span-2" key={section}>
                      <strong>{section}</strong>
                      <div className="admin-form-grid">
                        {Object.entries(fields).map(([field, value]) => (
                          <label className="span-2" key={field}>{field}
                            <textarea rows={field === 'intro' ? 2 : 1} value={value} onChange={(e) => updateHomepage(['copy', section, field], e.target.value)} />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-home-card">
                <h2 className="font-serif">Hero</h2>
                <div className="admin-form-grid">
                  <label>
                    Eyebrow
                    <input value={homepage.hero?.eyebrow || ''} onChange={(e) => updateHomepage(['hero', 'eyebrow'], e.target.value)} />
                  </label>
                  <label>
                    图片路径
                    <input value={homepage.hero?.image || ''} onChange={(e) => updateHomepage(['hero', 'image'], e.target.value)} />
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadHomepageImage(e.target.files?.[0], ['hero', 'image'])} />
                  </label>
                  <label className="span-2">
                    标题
                    <input value={homepage.hero?.title || ''} onChange={(e) => updateHomepage(['hero', 'title'], e.target.value)} />
                  </label>
                  <label className="span-2">
                    副标题
                    <textarea rows={3} value={homepage.hero?.subtitle || ''} onChange={(e) => updateHomepage(['hero', 'subtitle'], e.target.value)} />
                  </label>
                  <label>
                    主按钮文字
                    <input value={homepage.hero?.primaryCta?.label || ''} onChange={(e) => updateHomepage(['hero', 'primaryCta', 'label'], e.target.value)} />
                  </label>
                  <label>
                    主按钮链接
                    <input value={homepage.hero?.primaryCta?.href || ''} onChange={(e) => updateHomepage(['hero', 'primaryCta', 'href'], e.target.value)} />
                  </label>
                  <label>
                    次按钮文字
                    <input value={homepage.hero?.secondaryCta?.label || ''} onChange={(e) => updateHomepage(['hero', 'secondaryCta', 'label'], e.target.value)} />
                  </label>
                  <label>
                    次按钮链接
                    <input value={homepage.hero?.secondaryCta?.href || ''} onChange={(e) => updateHomepage(['hero', 'secondaryCta', 'href'], e.target.value)} />
                  </label>
                  <label className="span-2">
                    信任点（每行一个）
                    <textarea rows={4} value={(homepage.hero?.trustPoints || []).join('\n')} onChange={(e) => updateHomepageList(['hero', 'trustPoints'], e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="admin-home-card">
                <h2 className="font-serif">服务卡片</h2>
                <label>Booking policy version（运营和法律批准后填写）
                  <input value={homepage.bookingPolicyVersion || ''} onChange={(e) => updateHomepage(['bookingPolicyVersion'], e.target.value)} />
                </label>
                {(homepage.services || []).map((item, index) => (
                  <div className="admin-home-repeat" key={item.id || index}>
                    <div className="admin-form-grid">
                      <label>
                        编号
                        <input value={item.number || ''} onChange={(e) => updateHomepage(['services', index, 'number'], e.target.value)} />
                      </label>
                      <label>
                        ID
                        <input value={item.id || ''} onChange={(e) => updateHomepage(['services', index, 'id'], e.target.value)} />
                      </label>
                      <label className="span-2">
                        标题
                        <input value={item.title || ''} onChange={(e) => updateHomepage(['services', index, 'title'], e.target.value)} />
                      </label>
                      <label className="span-2">
                        简介
                        <textarea rows={2} value={item.summary || ''} onChange={(e) => updateHomepage(['services', index, 'summary'], e.target.value)} />
                      </label>
                      <label>
                        价格
                        <input value={item.price || ''} onChange={(e) => updateHomepage(['services', index, 'price'], e.target.value)} />
                      </label>
                      <label>
                        链接
                        <input value={item.href || ''} onChange={(e) => updateHomepage(['services', index, 'href'], e.target.value)} />
                      </label>
                      <label>图片路径
                        <input value={item.image || ''} onChange={(e) => updateHomepage(['services', index, 'image'], e.target.value)} />
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadHomepageImage(e.target.files?.[0], ['services', index, 'image'])} />
                      </label>
                      <label>图片 alt
                        <input value={item.imageAlt || ''} onChange={(e) => updateHomepage(['services', index, 'imageAlt'], e.target.value)} />
                      </label>
                      <label className="span-2">
                        预订说明
                        <textarea rows={2} value={item.booking || ''} onChange={(e) => updateHomepage(['services', index, 'booking'], e.target.value)} />
                      </label>
                      <label className="span-2"><input type="checkbox" checked={!!item.bookingApproved} onChange={(e) => updateHomepage(['services', index, 'bookingApproved'], e.target.checked)} /> 取消/改期条款已审批</label>
                      {['tagline', 'priceDetail', 'description', 'perfectFor', 'support', 'goodToKnow'].map((field) => (
                        <label className="span-2" key={field}>详情 {field}
                          <textarea rows={field === 'description' ? 4 : 2} value={item.details?.[field] || ''} onChange={(e) => updateHomepage(['services', index, 'details', field], e.target.value)} />
                        </label>
                      ))}
                      <label className="span-2">详情 included（每行一项）
                        <textarea rows={6} value={(item.details?.included || []).join('\n')} onChange={(e) => updateHomepageList(['services', index, 'details', 'included'], e.target.value)} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-home-card">
                <h2 className="font-serif">旅程卡片</h2>
                {(homepage.journeys || []).map((item, index) => (
                  <div className="admin-home-repeat" key={item.slug || index}>
                    <div className="admin-form-grid">
                      <label>
                        Slug
                        <input value={item.slug || ''} onChange={(e) => updateHomepage(['journeys', index, 'slug'], e.target.value)} />
                      </label>
                      <label>
                        天数
                        <input value={item.duration || ''} onChange={(e) => updateHomepage(['journeys', index, 'duration'], e.target.value)} />
                      </label>
                      <label className="span-2">
                        标题
                        <input value={item.title || ''} onChange={(e) => updateHomepage(['journeys', index, 'title'], e.target.value)} />
                      </label>
                      <label className="span-2">
                        简介
                        <textarea rows={2} value={item.summary || ''} onChange={(e) => updateHomepage(['journeys', index, 'summary'], e.target.value)} />
                      </label>
                      <label>
                        图片路径
                        <input value={item.image || ''} onChange={(e) => updateHomepage(['journeys', index, 'image'], e.target.value)} />
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadHomepageImage(e.target.files?.[0], ['journeys', index, 'image'])} />
                      </label>
                      <label>图片 alt
                        <input value={item.imageAlt || ''} onChange={(e) => updateHomepage(['journeys', index, 'imageAlt'], e.target.value)} />
                      </label>
                      <label>
                        价格
                        <input value={item.price || ''} onChange={(e) => updateHomepage(['journeys', index, 'price'], e.target.value)} />
                      </label>
                      <label className="span-2">
                        标签（每行一个）
                        <textarea rows={3} value={(item.tags || []).join('\n')} onChange={(e) => updateHomepageList(['journeys', index, 'tags'], e.target.value)} />
                      </label>
                      <label className="span-2">
                        团型说明
                        <input value={item.groupBasis || ''} onChange={(e) => updateHomepage(['journeys', index, 'groupBasis'], e.target.value)} />
                      </label>
                      <label className="span-2"><input type="checkbox" checked={!!item.priceApproved} onChange={(e) => updateHomepage(['journeys', index, 'priceApproved'], e.target.checked)} /> 价格和成团人数已批准发布</label>
                      <label className="span-2"><input type="checkbox" checked={!!item.detailsApproved} onChange={(e) => updateHomepage(['journeys', index, 'detailsApproved'], e.target.checked)} /> 路线详情已批准发布</label>
                      <label className="span-2">详情 highlights（每行一项）
                        <textarea rows={4} value={(item.details?.highlights || []).join('\n')} onChange={(e) => updateHomepageList(['journeys', index, 'details', 'highlights'], e.target.value)} />
                      </label>
                      <label className="span-2">详情 suggested flow（每行一项，未经批准保持空白）
                        <textarea rows={4} value={(item.details?.flow || []).join('\n')} onChange={(e) => updateHomepageList(['journeys', index, 'details', 'flow'], e.target.value)} />
                      </label>
                      {['idealFor', 'note'].map((field) => <label className="span-2" key={field}>详情 {field}
                        <textarea rows={2} value={item.details?.[field] || ''} onChange={(e) => updateHomepage(['journeys', index, 'details', field], e.target.value)} />
                      </label>)}
                      <label className="span-2">详情 gallery（每行：图片路径 | alt）
                        <textarea rows={3} value={(item.details?.gallery || []).map((image) => `${image.src} | ${image.alt}`).join('\n')} onChange={(e) => updateHomepageGallery(['journeys', index, 'details', 'gallery'], e.target.value)} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-home-card">
                <h2 className="font-serif">Why / Steps / FAQ</h2>
                <div className="admin-form-grid">
                  <label className="span-2">
                    Why 图片路径
                    <input value={homepage.whyImage || ''} onChange={(e) => updateHomepage(['whyImage'], e.target.value)} />
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadHomepageImage(e.target.files?.[0], ['whyImage'])} />
                  </label>
                  <label className="span-2">Why 图片 alt
                    <input value={homepage.whyImageAlt || ''} onChange={(e) => updateHomepage(['whyImageAlt'], e.target.value)} />
                  </label>
                  <label className="span-2">
                    Why 条目（每行：标题 | 描述）
                    <textarea rows={5} value={(homepage.whyItems || []).map((item) => item.join(' | ')).join('\n')} onChange={(e) => updateHomepagePairList(['whyItems'], e.target.value)} />
                  </label>
                  <label className="span-2">
                    步骤（每行：编号 | 标题 | 描述 | 标签）
                    <textarea rows={7} value={(homepage.steps || []).map((item) => item.join(' | ')).join('\n')} onChange={(e) => updateHomepagePairList(['steps'], e.target.value)} />
                  </label>
                  <label className="span-2">
                    FAQ（每行：问题 | 答案）
                    <textarea rows={8} value={(homepage.faqs || []).map((item) => item.join(' | ')).join('\n')} onChange={(e) => updateHomepagePairList(['faqs'], e.target.value)} />
                  </label>
                </div>
              </div>
              <div className="admin-home-card">
                <h2 className="font-serif">咨询表单文案</h2>
                <div className="admin-form-grid">
                  {Object.entries(homepage.formConfig || {}).map(([field, value]) => (
                    <label className="span-2" key={field}>{field}
                      <input value={value} onChange={(e) => updateHomepage(['formConfig', field], e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="admin-home-card">
                <h2 className="font-serif">Vlog</h2>
                <p className="admin-muted">仅在视频、封面、字幕摘要、alt 和授权记录齐全并启用时显示。</p>
                {(homepage.vlogs || []).map((item, index) => (
                  <div className="admin-home-repeat" key={index}>
                    <div className="admin-form-grid">
                      {['title', 'cover', 'video', 'subtitle', 'caption', 'alt', 'consentRecord'].map((field) => <label key={field}>{field}<input value={item[field] || ''} onChange={(e) => updateHomepage(['vlogs', index, field], e.target.value)} /></label>)}
                      <label>上传封面<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadHomepageImage(e.target.files?.[0], ['vlogs', index, 'cover'])} /></label>
                      <label><input type="checkbox" checked={!!item.published} onChange={(e) => updateHomepage(['vlogs', index, 'published'], e.target.checked)} /> 发布</label>
                    </div>
                    <button type="button" className="btn btn-outline" onClick={() => removeHomepageItem('vlogs', index)}>删除</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" onClick={() => addHomepageItem('vlogs', { title: '', cover: '', video: '', subtitle: '', caption: '', alt: '', consentRecord: '', published: false })}>新增 Vlog</button>
              </div>
              <div className="admin-home-card">
                <h2 className="font-serif">Guest Stories / 旅客评价</h2>
                <p className="admin-muted">首页标题：Words From Our Travelers。介绍：Real journeys. Real experiences. Stories worth sharing.</p>
                <p className="admin-muted">评价仅在真实来源及发布授权记录齐全并启用时显示。无已发布评价时，首页保留栏目标题、介绍和暂无评价提示，不显示虚构评价。</p>
                {(homepage.reviews || []).map((item, index) => (
                  <div className="admin-home-repeat" key={index}>
                    <div className="admin-form-grid">
                      {['quote', 'identity', 'tripType', 'tripDate', 'photo', 'photoAlt', 'sourceRecord', 'consentRecord'].map((field) => <label key={field}>{field}<input value={item[field] || ''} onChange={(e) => updateHomepage(['reviews', index, field], e.target.value)} /></label>)}
                      <label>上传照片<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadHomepageImage(e.target.files?.[0], ['reviews', index, 'photo'])} /></label>
                      <label><input type="checkbox" checked={!!item.published} onChange={(e) => updateHomepage(['reviews', index, 'published'], e.target.checked)} /> 发布</label>
                    </div>
                    <button type="button" className="btn btn-outline" onClick={() => removeHomepageItem('reviews', index)}>删除</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" onClick={() => addHomepageItem('reviews', { quote: '', identity: '', tripType: '', tripDate: '', photo: '', photoAlt: '', sourceRecord: '', consentRecord: '', published: false })}>新增 Review</button>
              </div>
            </div>
          )}

          <div className="admin-modal__actions">
            {homepageSaved && <span role="status">配置已保存</span>}
            <button type="button" className="btn btn-gold" disabled={saving} onClick={saveHomepage}>
              {saving ? '保存中…' : '保存首页配置'}
            </button>
          </div>
        </section>
      )}

      {tab === 'inquiries' && (
        <section className="admin-homepage-editor">
          <div className="admin-toolbar">
            <div><strong>咨询线索</strong><p className="admin-muted">最近 100 条。通知待发送时可手动重试。</p></div>
            <button type="button" className="btn btn-outline" onClick={() => loadInquiries().catch((err) => setError(err.message))}>刷新</button>
          </div>
          <div className="admin-inquiry-list">
            {inquiries.map((item) => (
              <article className="admin-home-card" key={item.inquiry_id}>
                <h2>{item.name} <small>{item.created_at}</small></h2>
                <p>{item.email} · {item.preferred_contact} {item.contact_handle}</p>
                <p>{item.preferred_service} · {item.travelers} traveler(s) · {item.travel_dates}</p>
                {item.destinations && <p>Destinations: {item.destinations}</p>}
                {item.message && <p>{item.message}</p>}
                <p>Notification: {item.notification_status} · Attempts: {item.notification_attempts}</p>
                {item.notification_status !== 'sent' && <button type="button" className="btn btn-outline" onClick={async () => {
                  try {
                    await api(INQUIRIES_API, { method: 'POST', body: JSON.stringify({ inquiry_id: item.inquiry_id }) })
                    await loadInquiries()
                  } catch (err) { setError(err.message) }
                }}>重试通知</button>}
              </article>
            ))}
            {inquiries.length === 0 && <p className="admin-muted">暂无咨询线索</p>}
          </div>
        </section>
      )}

      {tab === 'products' && (
        <>
          <div className="admin-toolbar">
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="搜索标题 / 价格…"
            />
            <span className="admin-muted">共 {filteredProducts.length} 条</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>排序</th>
                  <th>产品</th>
                  <th>价格</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sort_order}</td>
                    <td>
                      <div className="admin-product-cell">
                        {p.image ? <img src={p.image} alt="" /> : <div className="admin-product-cell__ph" />}
                        <div>
                          <strong>{p.title}</strong>
                          <div className="admin-muted">{p.duration || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.price || '—'}</td>
                    <td>
                      <span className={`admin-badge${p.is_published ? ' is-on' : ''}`}>
                        {p.is_published ? '已上架' : '已下架'}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button type="button" onClick={() => openEditProduct(p)}>
                        编辑
                      </button>
                      <button type="button" onClick={() => togglePublish(p)}>
                        {p.is_published ? '下架' : '上架'}
                      </button>
                      <button type="button" className="is-danger" onClick={() => removeProduct(p)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'guides' && (
        <>
          <div className="admin-subfilters">
            {[
              ['all', `全部 (${guideCounts.all})`],
              ['pending', `待审核 (${guideCounts.pending})`],
              ['approved', `已通过 (${guideCounts.approved})`],
              ['rejected', `已拒绝 (${guideCounts.rejected})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={guideStatus === key ? 'is-active' : ''}
                onClick={() => changeGuideFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="admin-toolbar">
            <input
              value={guideQuery}
              onChange={(e) => setGuideQuery(e.target.value)}
              placeholder="搜索姓名 / 地点 / 邮箱…"
            />
            <span className="admin-muted">共 {filteredGuides.length} 条</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>向导</th>
                  <th>地点</th>
                  <th>语言</th>
                  <th>日价</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuides.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div className="admin-product-cell">
                        {g.photo_url ? (
                          <img src={g.photo_url} alt="" />
                        ) : (
                          <div className="admin-product-cell__ph" />
                        )}
                        <div>
                          <strong>{g.full_name}</strong>
                          <div className="admin-muted">{g.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{g.location || '—'}</td>
                    <td className="admin-muted">{(g.languages || []).join(', ') || '—'}</td>
                    <td>{g.price_per_day != null ? `$${g.price_per_day}` : '—'}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${g.status}`}>
                        {STATUS_LABEL[g.status] || g.status}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button type="button" onClick={() => openEditGuide(g)}>
                        查看
                      </button>
                      {g.status !== 'approved' && (
                        <button type="button" onClick={() => setGuideStatusQuick(g, 'approved')}>
                          通过
                        </button>
                      )}
                      {g.status !== 'rejected' && (
                        <button type="button" onClick={() => setGuideStatusQuick(g, 'rejected')}>
                          拒绝
                        </button>
                      )}
                      <button type="button" className="is-danger" onClick={() => removeGuide(g)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'leads' && (
        <>
          <section className="admin-lead-grid">
            <div className="admin-lead-panel">
              <div>
                <strong>关键词配置</strong>
                <p className="admin-muted">每行一个关键词。系统生成搜索链接，管理员打开后手动筛选并导入帖子。</p>
              </div>
              <textarea
                rows={7}
                value={leadKeywords}
                onChange={(e) => setLeadKeywords(e.target.value)}
                spellCheck={false}
              />
              <button type="button" className="btn btn-gold" disabled={saving} onClick={saveLeadKeywords}>
                {saving ? '保存中…' : '保存关键词'}
              </button>
            </div>

            <div className="admin-lead-panel">
              <div>
                <strong>发现具体页面</strong>
                <p className="admin-muted">按关键词查找相关帖子/页面，点击标题可访问原网页，再决定是否导入。</p>
              </div>
              <button type="button" className="btn btn-gold" disabled={leadDiscovering} onClick={discoverLeadPages}>
                {leadDiscovering ? '查找中…' : '查找相关页面'}
              </button>
              {leadDiscoverResults.length > 0 && (
                <div className="admin-result-list">
                  {leadDiscoverResults.map((result) => (
                    <div key={result.url} className="admin-result-row">
                      <div>
                        <a href={result.url} target="_blank" rel="noreferrer">
                          {result.title}
                        </a>
                        <p className="admin-muted">
                          {result.platform} · {result.keyword}
                          {result.is_search_page ? ' · 平台搜索入口' : ''}
                          {result.already_imported ? ' · 已导入' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={result.already_imported}
                        onClick={() =>
                          openCreateLead({
                            platform: result.platform,
                            keyword: result.keyword,
                            title: result.title,
                            resultUrl: result.url,
                          })
                        }
                      >
                        {result.is_search_page ? '手动导入' : '导入'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="admin-link-list">
                <p className="admin-muted">备用：直接打开平台搜索页</p>
                {leadLinks.slice(0, 18).map((link) => (
                  <div key={`${link.platform}-${link.keyword}`} className="admin-link-row">
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.platform} · {link.keyword}
                    </a>
                    <button type="button" onClick={() => openCreateLead(link)}>
                      导入
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="admin-subfilters">
            {['all', 'new', 'reviewing', 'drafted', 'posted', 'replied', 'ignored'].map((key) => (
              <button
                key={key}
                type="button"
                className={leadStatus === key ? 'is-active' : ''}
                onClick={() => setLeadStatus(key)}
              >
                {key === 'all' ? '全部' : LEAD_STATUS_LABEL[key]}
              </button>
            ))}
          </div>

          <div className="admin-toolbar">
            <input
              value={leadQuery}
              onChange={(e) => setLeadQuery(e.target.value)}
              placeholder="搜索平台 / 标题 / 关键词 / 链接…"
            />
            <span className="admin-muted">共 {filteredLeads.length} 条</span>
            <span className={`admin-badge${deepseekConfigured ? ' is-on' : ''}`}>
              DeepSeek {deepseekConfigured ? '已配置' : '未配置'}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-table--leads">
              <thead>
                <tr>
                  <th>评分</th>
                  <th>线索</th>
                  <th>平台</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.score}</strong>
                    </td>
                    <td>
                      <strong>{lead.title || '未命名线索'}</strong>
                      <div className="admin-muted">{lead.keyword || lead.summary || '—'}</div>
                    </td>
                    <td>{lead.platform || 'Manual'}</td>
                    <td>
                      <span className={`admin-badge admin-badge--lead-${lead.status}`}>
                        {LEAD_STATUS_LABEL[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {lead.url && (
                        <a href={lead.url} target="_blank" rel="noreferrer">
                          打开原帖
                        </a>
                      )}
                      <button type="button" onClick={() => openEditLead(lead)}>
                        编辑
                      </button>
                      <button type="button" disabled={saving} onClick={() => generateLeadDraft(lead)}>
                        AI 草稿
                      </button>
                      {lead.status !== 'posted' && (
                        <button type="button" onClick={() => updateLead(lead, { status: 'posted' })}>
                          标记已发
                        </button>
                      )}
                      <button type="button" className="is-danger" onClick={() => removeLead(lead)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan="5" className="admin-muted">
                      暂无符合条件的线索。先打开搜索链接，找到帖子后手动导入。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {productEditing && (
        <div className="admin-modal">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="关闭"
            onClick={() => setProductEditing(null)}
          />
          <form className="admin-modal__panel" onSubmit={saveProduct}>
            <h2 className="font-serif">{productEditing === 'new' ? '新建产品' : '编辑产品'}</h2>
            <div className="admin-form-grid">
              <label className="span-2">
                标题 *
                <input
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="span-2">
                副标题
                <input
                  value={productForm.subtitle}
                  onChange={(e) => setProductForm((f) => ({ ...f, subtitle: e.target.value }))}
                />
              </label>
              <label className="span-2">
                简介
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label>
                价格
                <input
                  value={productForm.price}
                  onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="$599"
                />
              </label>
              <label>
                天数
                <input
                  value={productForm.duration}
                  onChange={(e) => setProductForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="5 Days"
                />
              </label>
              <label>
                评分
                <input
                  type="number"
                  step="0.1"
                  value={productForm.rating}
                  onChange={(e) => setProductForm((f) => ({ ...f, rating: e.target.value }))}
                />
              </label>
              <label>
                评价数
                <input
                  type="number"
                  value={productForm.review_count}
                  onChange={(e) => setProductForm((f) => ({ ...f, review_count: e.target.value }))}
                />
              </label>
              <label>
                海拔
                <input
                  value={productForm.max_altitude}
                  onChange={(e) => setProductForm((f) => ({ ...f, max_altitude: e.target.value }))}
                />
              </label>
              <label>
                团型
                <input
                  value={productForm.group_size}
                  onChange={(e) => setProductForm((f) => ({ ...f, group_size: e.target.value }))}
                />
              </label>
              <label>
                排序
                <input
                  type="number"
                  value={productForm.sort_order}
                  onChange={(e) => setProductForm((f) => ({ ...f, sort_order: e.target.value }))}
                />
              </label>
              <label>
                封面图路径
                <input
                  value={productForm.image}
                  onChange={(e) => setProductForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="/itineraries/1-bipeng.jpg"
                />
              </label>
              <label className="span-2">
                亮点（每行一个）
                <textarea
                  rows={4}
                  value={productForm.highlights}
                  onChange={(e) => setProductForm((f) => ({ ...f, highlights: e.target.value }))}
                />
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={!!productForm.is_published}
                  onChange={(e) => setProductForm((f) => ({ ...f, is_published: e.target.checked }))}
                />
                上架（前台可见）
              </label>
            </div>
            {error && <p className="admin-error">{error}</p>}
            <div className="admin-modal__actions">
              <button type="button" className="btn btn-outline" onClick={() => setProductEditing(null)}>
                取消
              </button>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {guideEditing && (
        <div className="admin-modal">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="关闭"
            onClick={() => setGuideEditing(null)}
          />
          <form className="admin-modal__panel" onSubmit={saveGuide}>
            <h2 className="font-serif">{guideEditing === 'new' ? '新建向导' : '审核 / 编辑向导'}</h2>
            <div className="admin-form-grid">
              <label>
                姓名 *
                <input
                  required
                  value={guideForm.full_name}
                  onChange={(e) => setGuideForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </label>
              <label>
                邮箱 *
                <input
                  required
                  type="email"
                  value={guideForm.email}
                  onChange={(e) => setGuideForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>
              <label>
                电话
                <input
                  value={guideForm.phone}
                  onChange={(e) => setGuideForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>
              <label>
                地点
                <input
                  value={guideForm.location}
                  onChange={(e) => setGuideForm((f) => ({ ...f, location: e.target.value }))}
                />
              </label>
              <label>
                状态
                <select
                  value={guideForm.status}
                  onChange={(e) => setGuideForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="pending">待审核</option>
                  <option value="approved">已通过（前台可见）</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </label>
              <label>
                日价 ($)
                <input
                  type="number"
                  value={guideForm.price_per_day}
                  onChange={(e) => setGuideForm((f) => ({ ...f, price_per_day: e.target.value }))}
                />
              </label>
              <label>
                评分
                <input
                  type="number"
                  step="0.1"
                  value={guideForm.rating}
                  onChange={(e) => setGuideForm((f) => ({ ...f, rating: e.target.value }))}
                />
              </label>
              <label>
                评价数
                <input
                  type="number"
                  value={guideForm.reviews_count}
                  onChange={(e) => setGuideForm((f) => ({ ...f, reviews_count: e.target.value }))}
                />
              </label>
              <label>
                经验
                <input
                  value={guideForm.experience}
                  onChange={(e) => setGuideForm((f) => ({ ...f, experience: e.target.value }))}
                />
              </label>
              <label>
                头像 URL
                <input
                  value={guideForm.photo_url}
                  onChange={(e) => setGuideForm((f) => ({ ...f, photo_url: e.target.value }))}
                />
              </label>
              <label className="span-2">
                语言（逗号分隔）
                <input
                  value={guideForm.languages}
                  onChange={(e) => setGuideForm((f) => ({ ...f, languages: e.target.value }))}
                />
              </label>
              <label className="span-2">
                专长（逗号分隔）
                <input
                  value={guideForm.specialties}
                  onChange={(e) => setGuideForm((f) => ({ ...f, specialties: e.target.value }))}
                />
              </label>
              <label className="span-2">
                简介
                <textarea
                  rows={4}
                  value={guideForm.bio}
                  onChange={(e) => setGuideForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={!!guideForm.has_vehicle}
                  onChange={(e) => setGuideForm((f) => ({ ...f, has_vehicle: e.target.checked }))}
                />
                有车辆
              </label>
              {guideForm.has_vehicle && (
                <>
                  <label>
                    车型
                    <input
                      value={guideForm.vehicle_type}
                      onChange={(e) => setGuideForm((f) => ({ ...f, vehicle_type: e.target.value }))}
                    />
                  </label>
                  <label>
                    车牌
                    <input
                      value={guideForm.vehicle_plate}
                      onChange={(e) => setGuideForm((f) => ({ ...f, vehicle_plate: e.target.value }))}
                    />
                  </label>
                </>
              )}
              <label className="span-2">
                管理员备注
                <textarea
                  rows={2}
                  value={guideForm.admin_notes}
                  onChange={(e) => setGuideForm((f) => ({ ...f, admin_notes: e.target.value }))}
                />
              </label>
              {(guideForm.id_document_url ||
                guideForm.vehicle_photo_url ||
                guideForm.insurance_document_url ||
                guideForm.intro_video_url) && (
                <div className="span-2 admin-file-links">
                  <p className="admin-muted">申请附件</p>
                  {guideForm.id_document_url && (
                    <a href={guideForm.id_document_url} target="_blank" rel="noreferrer">
                      证件
                    </a>
                  )}
                  {guideForm.vehicle_photo_url && (
                    <a href={guideForm.vehicle_photo_url} target="_blank" rel="noreferrer">
                      车辆照
                    </a>
                  )}
                  {guideForm.insurance_document_url && (
                    <a href={guideForm.insurance_document_url} target="_blank" rel="noreferrer">
                      保险
                    </a>
                  )}
                  {guideForm.intro_video_url && (
                    <a href={guideForm.intro_video_url} target="_blank" rel="noreferrer">
                      介绍视频
                    </a>
                  )}
                </div>
              )}
            </div>
            {error && <p className="admin-error">{error}</p>}
            <div className="admin-modal__actions">
              <button type="button" className="btn btn-outline" onClick={() => setGuideEditing(null)}>
                取消
              </button>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {leadEditing && (
        <div className="admin-modal">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="关闭"
            onClick={() => setLeadEditing(null)}
          />
          <form className="admin-modal__panel admin-modal__panel--wide" onSubmit={saveLead}>
            <h2 className="font-serif">{leadEditing === 'new' ? '导入旅游线索' : '编辑旅游线索'}</h2>
            <div className="admin-form-grid">
              <label>
                平台
                <input
                  value={leadForm.platform}
                  onChange={(e) => setLeadForm((f) => ({ ...f, platform: e.target.value }))}
                  placeholder="Reddit / Tripadvisor / Quora"
                />
              </label>
              <label>
                关键词
                <input
                  value={leadForm.keyword}
                  onChange={(e) => setLeadForm((f) => ({ ...f, keyword: e.target.value }))}
                />
              </label>
              <label className="span-2">
                标题 *
                <input
                  required
                  value={leadForm.title}
                  onChange={(e) => setLeadForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="span-2">
                原帖 URL
                <input
                  type="url"
                  value={leadForm.url}
                  onChange={(e) => setLeadForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                />
              </label>
              <label>
                作者 / 用户名
                <input
                  value={leadForm.author}
                  onChange={(e) => setLeadForm((f) => ({ ...f, author: e.target.value }))}
                />
              </label>
              <label>
                状态
                <select
                  value={leadForm.status}
                  onChange={(e) => setLeadForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {Object.entries(LEAD_STATUS_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                帖子摘要 / 用户需求
                <textarea
                  rows={4}
                  value={leadForm.summary}
                  onChange={(e) => setLeadForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="记录对方正在问什么、行程时间、目的地、预算或痛点"
                />
              </label>
              <label>
                评分
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={leadForm.score}
                  onChange={(e) => setLeadForm((f) => ({ ...f, score: e.target.value }))}
                  placeholder="留空或 0 时自动评分"
                />
              </label>
              <label>
                发布记录
                <input value={leadForm.posted_at || '未发布'} readOnly />
              </label>
              <label className="span-2">
                管理员备注
                <textarea
                  rows={2}
                  value={leadForm.admin_notes}
                  onChange={(e) => setLeadForm((f) => ({ ...f, admin_notes: e.target.value }))}
                />
              </label>
              <label className="span-2">
                DeepSeek 英文回复草稿
                <textarea
                  rows={8}
                  value={leadForm.reply_draft}
                  onChange={(e) => setLeadForm((f) => ({ ...f, reply_draft: e.target.value }))}
                  placeholder="点击 AI 草稿生成后，可在这里人工修改，再去原帖手动发布。"
                />
              </label>
            </div>
            {error && <p className="admin-error">{error}</p>}
            <div className="admin-modal__actions">
              {leadEditing !== 'new' && (
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={saving}
                  onClick={() => generateLeadDraft(leadForm)}
                >
                  {saving ? '生成中…' : '生成 AI 草稿'}
                </button>
              )}
              {leadForm.url && (
                <a className="btn btn-outline" href={leadForm.url} target="_blank" rel="noreferrer">
                  打开原帖
                </a>
              )}
              <button type="button" className="btn btn-outline" onClick={() => setLeadEditing(null)}>
                取消
              </button>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
