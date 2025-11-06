// 게시글 로더 (마크다운 파싱 및 Giscus 로딩)
(function () {
  // URL 파라미터에서 게시글 파일명 추출
  function getPostFile() {
    const params = new URLSearchParams(window.location.search);
    return params.get('post');
  }

  // Front Matter 파싱
  function parseFrontMatter(content) {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontMatterMatch) {
      return { metadata: {}, content: content };
    }

    const frontMatter = frontMatterMatch[1];
    const postContent = frontMatterMatch[2];
    const metadata = {};

    frontMatter.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // 따옴표 제거
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // 배열 파싱 (tags)
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch {
            value = value
              .slice(1, -1)
              .split(',')
              .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''));
          }
        }

        metadata[key] = value;
      }
    });

    return { metadata, content: postContent };
  }

  // 마크다운 로딩 및 렌더링
  async function loadPost() {
    const postFile = getPostFile();
    
    if (!postFile) {
      showError('게시글을 찾을 수 없습니다.');
      return;
    }

    try {
      // 마크다운 파일 로딩
      const response = await fetch(`pages/${postFile}`);
      if (!response.ok) {
        throw new Error('Post not found');
      }

      const markdown = await response.text();
      const { metadata, content } = parseFrontMatter(markdown);

      // 메타데이터 렌더링
      renderMetadata(metadata);

      // 마크다운을 HTML로 변환 (marked.js 사용)
      if (typeof marked === 'undefined') {
        throw new Error('marked.js is not loaded');
      }

      // marked 설정
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
      });

      const html = marked.parse(content);
      
      // 콘텐츠 렌더링
      const postContent = document.getElementById('post-content');
      if (postContent) {
        postContent.innerHTML = html;
      }

      // 코드 하이라이팅 (Prism.js)
      if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
      }

      // Giscus 댓글 로딩
      loadGiscus();

    } catch (error) {
      console.error('Error loading post:', error);
      showError('게시글을 불러올 수 없습니다.');
    }
  }

  // 메타데이터 렌더링
  function renderMetadata(metadata) {
    // 제목
    const titleEl = document.getElementById('post-title');
    if (titleEl && metadata.title) {
      titleEl.textContent = metadata.title;
      document.title = `${metadata.title} | Blog`;
    }

    // 날짜
    const dateEl = document.getElementById('post-date');
    if (dateEl && metadata.date) {
      dateEl.textContent = formatDate(metadata.date);
    }

    // 카테고리
    const categoryEl = document.getElementById('post-category');
    if (categoryEl && metadata.category) {
      categoryEl.textContent = metadata.category;
      categoryEl.style.display = 'inline';
    } else if (categoryEl) {
      categoryEl.style.display = 'none';
    }

    // 태그
    const tagsEl = document.getElementById('post-tags');
    if (tagsEl && metadata.tags && metadata.tags.length > 0) {
      tagsEl.innerHTML = metadata.tags
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join('');
      tagsEl.style.display = 'flex';
    } else if (tagsEl) {
      tagsEl.style.display = 'none';
    }
  }

  // Giscus 댓글 로딩
  function loadGiscus() {
    const commentsSection = document.getElementById('comments');
    if (!commentsSection) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'ttakmyhome-developer/ttakmyhome-developer.github.io');
    script.setAttribute('data-repo-id', 'R_kgDOQQWkPw');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOQQWkP84Cxfvp');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ko');
    script.crossOrigin = 'anonymous';
    script.async = true;

    commentsSection.appendChild(script);
  }

  // 에러 표시
  function showError(message) {
    const postContent = document.getElementById('post-content');
    if (postContent) {
      postContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p>${escapeHtml(message)}</p>
          <p><a href="index.html" class="back-link">← 목록으로 돌아가기</a></p>
        </div>
      `;
    }
  }

  // 날짜 포맷
  function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

  // HTML 이스케이프
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 초기화
  if (document.getElementById('post-content')) {
    loadPost();
  }
})();

