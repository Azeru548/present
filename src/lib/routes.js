export function dashboardPath(role) {
  return role === 'lecturer' ? '/dashboard/lecturer' : '/dashboard/student';
}

export function loginPath(role) {
  return role === 'lecturer' ? '/login/lecturer' : '/login/student';
}
