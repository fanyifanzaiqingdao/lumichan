import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './Admin.css'

const AUTH_API = '/api/admin-auth.php'
const PRODUCTS_API = '/api/admin-products.php'
const GUIDES_API = '/api/admin-guides.php'

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
  const [tab, setTab] = useState('products') // products | guides
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

  async function loadAll() {
    await Promise.all([loadProducts(), loadGuides(guideStatus)])
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
          <p>管理行程产品与向导审核</p>
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
          <p className="admin-muted">产品上架 · 向导审核（同原站逻辑）</p>
        </div>
        <div className="admin-top__actions">
          <Link to={tab === 'guides' ? '/traveler/guides' : '/traveler/itineraries'} className="btn btn-outline">
            查看前台
          </Link>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            退出
          </button>
          {tab === 'products' ? (
            <button type="button" className="btn btn-gold" onClick={openCreateProduct}>
              + 新建产品
            </button>
          ) : (
            <button type="button" className="btn btn-gold" onClick={openCreateGuide}>
              + 新建向导
            </button>
          )}
        </div>
      </header>

      <div className="admin-tabs">
        <button type="button" className={tab === 'products' ? 'is-active' : ''} onClick={() => setTab('products')}>
          产品管理
        </button>
        <button type="button" className={tab === 'guides' ? 'is-active' : ''} onClick={() => setTab('guides')}>
          向导管理
          {guideCounts.pending > 0 && <span className="admin-tab-badge">{guideCounts.pending}</span>}
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

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
    </div>
  )
}
