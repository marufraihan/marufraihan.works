const singleton = (S, type, title) => S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title))

export const SINGLETONS = ['home', 'studioPage', 'settings']

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Projects')
        .id('projects')
        .child(
          S.list()
            .title('Projects')
            .items([
              S.listItem().title('All projects').id('all').child(S.documentTypeList('project').title('All projects').defaultOrdering([{field: '_updatedAt', direction: 'desc'}])),
              S.divider(),
              ...[
                ['architecture', 'Architecture'],
                ['photography', 'Photography'],
                ['experiential', 'Experiential'],
                ['film', 'Film'],
              ].map(([v, t]) =>
                S.listItem().title(t).id(v).child(S.documentList().title(t).schemaType('project').filter('_type == "project" && $d in disciplines').params({d: v}).defaultOrdering([{field: 'sortDate', direction: 'desc'}])),
              ),
              S.divider(),
              S.listItem().title('On homepage').id('featured').child(S.documentList().title('On homepage').schemaType('project').filter('_type == "project" && featured == true').defaultOrdering([{field: 'featuredOrder', direction: 'asc'}])),
            ]),
        ),
      S.documentTypeListItem('post').title('Journal'),
      S.divider(),
      singleton(S, 'home', 'Homepage'),
      singleton(S, 'studioPage', 'Studio page'),
      S.documentTypeListItem('member').title('Team'),
      singleton(S, 'settings', 'Contact & settings'),
      S.divider(),
      S.documentTypeListItem('redirect').title('Extra redirects'),
    ])
