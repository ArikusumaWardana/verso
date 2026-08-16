function escapeAttribute(value: string) {
  return value.replace(/[&"<>]/g, (character) => ({
    "&": "&amp;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;"
  })[character] ?? character);
}

export function resolveArchivedImages(contentHtml: string, signedUrls: Map<string, string>) {
  return contentHtml.replace(/<img\b[^>]*>/gi, (imageTag) => {
    const archivedPath = imageTag.match(/\sdata-verso-path=(['"])(.*?)\1/i);
    if (!archivedPath) return imageTag;

    const signedUrl = signedUrls.get(archivedPath[2]);
    const resolvedTag = imageTag.replace(archivedPath[0], "");
    if (!signedUrl) return resolvedTag;

    const source = `src="${escapeAttribute(signedUrl)}"`;
    return /\ssrc=(['"]).*?\1/i.test(resolvedTag)
      ? resolvedTag.replace(/src=(['"]).*?\1/i, source)
      : resolvedTag.replace(/^<img/i, `<img ${source}`);
  });
}
