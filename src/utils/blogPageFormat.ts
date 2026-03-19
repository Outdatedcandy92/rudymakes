export interface BlogSeriesPageFormat {
  indexFile: string;
  pages: string[];
  listTitle?: string;
  pageTitles?: Record<string, string>;
}

const titleCaseWords = (value: string): string => {
  return value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const blogSeriesPageFormat: Record<string, BlogSeriesPageFormat> = {
  'usb-hub': {
    indexFile: 'readme',
    pages: ['readme', 'easyeda-tuorial', 'schematics', 'pcb', 'ordering'],
    listTitle: 'USB Hub Guide',
    pageTitles: {
      readme: 'USB Hub Guide',
      'easyeda-tuorial': 'Getting Started',
    },
  },
};

const splitId = (id: string): string[] => id.split('/').filter(Boolean);

const getSeriesFileFromId = (id: string): { seriesSlug: string; fileName: string } | null => {
  const idParts = splitId(id);
  if (idParts.length < 2) {
    return null;
  }

  const [seriesSlug, ...rest] = idParts;
  return {
    seriesSlug,
    fileName: rest.join('/'),
  };
};

export const getBlogRouteSegments = (id: string): string[] => {
  const seriesFile = getSeriesFileFromId(id);
  if (!seriesFile) {
    return splitId(id);
  }

  const seriesFormat = blogSeriesPageFormat[seriesFile.seriesSlug];
  if (seriesFormat && seriesFile.fileName === seriesFormat.indexFile) {
    return [seriesFile.seriesSlug];
  }

  return splitId(id);
};

export const getBlogRoutePath = (id: string): string => {
  const encodedParts = getBlogRouteSegments(id).map((segment) => encodeURIComponent(segment));
  return `/blog/${encodedParts.join('/')}`;
};

export const getBlogDisplayTitle = (blog: { id: string; data?: { title?: string } }): string => {
  if (blog.data?.title) {
    return blog.data.title;
  }

  const seriesFile = getSeriesFileFromId(blog.id);
  if (!seriesFile) {
    return titleCaseWords(splitId(blog.id).at(-1) ?? blog.id);
  }

  const seriesFormat = blogSeriesPageFormat[seriesFile.seriesSlug];
  if (seriesFormat?.pageTitles?.[seriesFile.fileName]) {
    return seriesFormat.pageTitles[seriesFile.fileName];
  }

  if (seriesFile.fileName === seriesFormat?.indexFile && seriesFormat.listTitle) {
    return seriesFormat.listTitle;
  }

  return titleCaseWords(seriesFile.fileName);
};

export const isPrimaryBlogListEntry = (blog: { id: string }): boolean => {
  const seriesFile = getSeriesFileFromId(blog.id);
  if (!seriesFile) {
    return true;
  }

  const seriesFormat = blogSeriesPageFormat[seriesFile.seriesSlug];
  if (!seriesFormat) {
    return true;
  }

  return seriesFile.fileName === seriesFormat.indexFile;
};

export interface BlogPageNavigationLink {
  href: string;
  title: string;
}

export interface BlogPageNavigation {
  previous?: BlogPageNavigationLink;
  next?: BlogPageNavigationLink;
}

export const getBlogSeriesNavigation = (
  currentBlog: { id: string },
  allBlogs: Array<{ id: string; data?: { title?: string } }>
): BlogPageNavigation | null => {
  const seriesFile = getSeriesFileFromId(currentBlog.id);
  if (!seriesFile) {
    return null;
  }

  const seriesFormat = blogSeriesPageFormat[seriesFile.seriesSlug];
  if (!seriesFormat) {
    return null;
  }

  const allById = new Map(allBlogs.map((blog) => [blog.id, blog]));
  const orderedExistingIds = seriesFormat.pages
    .map((pageFileName) => `${seriesFile.seriesSlug}/${pageFileName}`)
    .filter((id) => allById.has(id));

  const currentIndex = orderedExistingIds.indexOf(currentBlog.id);
  if (currentIndex === -1) {
    return null;
  }

  const previousId = orderedExistingIds[currentIndex - 1];
  const nextId = orderedExistingIds[currentIndex + 1];

  return {
    previous: previousId
      ? {
          href: getBlogRoutePath(previousId),
          title: getBlogDisplayTitle(allById.get(previousId)!),
        }
      : undefined,
    next: nextId
      ? {
          href: getBlogRoutePath(nextId),
          title: getBlogDisplayTitle(allById.get(nextId)!),
        }
      : undefined,
  };
};
