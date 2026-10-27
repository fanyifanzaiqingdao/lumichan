import { useEffect, useState } from 'react'
import defaultHomepage from '../data/homepage.js'
import { Link } from 'react-router-dom'
import ServicePolicies from '../components/ServicePolicies.jsx'
import './SimplePage.css'

function Block({ block, registeredAddress, entityName }) {
  if (typeof block.text === 'string') block = { ...block, text: block.text.replaceAll('{{REGISTERED_ADDRESS}}', registeredAddress).replaceAll('寰宇纵横国际旅行社（重庆）有限公司四川第四分公司', entityName) }
  if (block.type === 'service-policies') return <ServicePolicies />
  if (block.type === 'h2') {
    return <h2 className="font-serif simple-page__h2">{block.text}</h2>
  }
  if (block.type === 'hr') {
    return <hr className="simple-page__hr" />
  }
  if (block.type === 'ul') {
    return (
      <ul className="simple-page__list">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.type === 'email') {
    return (
      <p className="simple-page__email">
        <a href={`mailto:${block.text}`}>{block.text}</a>
      </p>
    )
  }
  return <p>{block.text}</p>
}

export default function SimplePage({ title, updated, blocks, children }) {
  const legalPage = blocks?.some((block) => block.text?.includes('{{REGISTERED_ADDRESS}}'))
  const [identity,setIdentity] = useState(defaultHomepage.legalIdentity)
  useEffect(() => {
    if (!legalPage) return
    const controller = new AbortController()
    fetch('/api/homepage.php', { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { if (data.homepage?.legalIdentity) setIdentity(data.homepage.legalIdentity) }).catch(() => {})
    return () => controller.abort()
  }, [legalPage])
  const approved = identity?.status === 'approved'
  const preview = import.meta.env.DEV || import.meta.env.MODE === 'staging'
  const registeredAddress = approved || preview ? `${identity.registeredAddressChinese} / ${identity.registeredAddressEnglish}` : 'Please contact Lumichan for verified registration details.'
  return (
    <div className="simple-page theme-dark-page">
      <section className="simple-page__hero">
        <div className="section">
          <h1 className="font-serif">{title}</h1>
          {updated ? <p className="simple-page__updated">Last Updated: {updated}</p> : null}
        </div>
      </section>
      <section className="simple-page__body section">
        {legalPage && preview && !approved && <p role="note" className="legal-draft-notice">Registration details are a draft pending verification against current original documents. Version: {identity.version}</p>}
        {legalPage && approved && <p className="simple-page__updated">Registration record: {identity.version} · Effective: {identity.effectiveDate}</p>}
        {blocks?.length ? (
          <div className="simple-page__prose">
            {blocks.map((block, i) => (
              <Block key={`${block.type}-${i}`} block={block} registeredAddress={registeredAddress} entityName={approved || preview ? identity.entityName : defaultHomepage.legalIdentity.entityName} />
            ))}
          </div>
        ) : (
          children || (
            <p>
              Content for this page will be published soon. Meanwhile, feel free to{' '}
              <Link to="/traveler/contact">contact us</Link>.
            </p>
          )
        )}
      </section>
    </div>
  )
}
