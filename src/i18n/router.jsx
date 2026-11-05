import { forwardRef } from 'react'
import { Link as RouterLink, NavLink as RouterNavLink, Navigate as RouterNavigate, useLocation as routerLocation, useNavigate as routerNavigate } from 'react-router-dom'
import { getLanguage } from './runtime.js'
import { localizedPath, stripLanguage } from './routes.js'
export { Outlet, Routes, Route, useParams, useSearchParams } from 'react-router-dom'
export const href = to => localizedPath(to, getLanguage())
export const Link = forwardRef(function Link({ to, ...props }, ref) { return <RouterLink {...props} to={href(to)} ref={ref} /> })
export const NavLink = forwardRef(function NavLink({ to, ...props }, ref) { return <RouterNavLink {...props} to={href(to)} ref={ref} /> })
export function Navigate({ to, ...props }) { return <RouterNavigate {...props} to={href(to)} /> }
export function useLocation() { const location = routerLocation(); return { ...location, pathname: stripLanguage(location.pathname).replace(/\/$/, '') || '/' } }
export function useNavigate() { const navigate = routerNavigate(); return (to, options) => navigate(typeof to === 'number' ? to : href(to), options) }
