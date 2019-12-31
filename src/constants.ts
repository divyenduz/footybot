export const DEFAULT_GROUPS = [
  ...(process.env.NODE_ENV === 'development'
    ? [
        {
          groupId: '29870797',
          identifier: 'Terrible Football Berlin',
        },
      ]
    : []),

  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          groupId: '19679886',
          identifier: 'Berlin Football Group',
        },
      ]
    : []),
]
