export const DEFAULT_GROUPS = [
  // INSERT INTO `Group` (`id`, `user`) VALUES ('29870797', 'ckei6ctel0000ds1mhqilch5u');
  ...(process.env.NODE_ENV === 'development'
    ? [
        {
          groupId: '29870797',
          identifier: 'Terrible Football Berlin',
        },
      ]
    : []),
  // INSERT INTO `Group` (`id`, `user`) VALUES ('19679886', 'ckei6ctel0000ds1mhqilch5u');
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          groupId: '19679886',
          identifier: 'Berlin Football Group',
        },
      ]
    : []),
]
