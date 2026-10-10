import { books, software } from '../content/site.mjs';

export function bookList({ escape }) {
  return `<ul class="book-list">${books.map(book => `<li><div class="book-entry"><div class="book-cover"><img src="/books/${escape(book.cover)}" alt="Cover of ${escape(book.title)}" width="${book.width}" height="${book.height}" loading="lazy" decoding="async"></div><h3 class="recommendation-title">${escape(book.title)}</h3><p class="book-author">${escape(book.author)}</p></div></li>`).join('')}</ul>`;
}

export function softwareList({ escape }) {
  return `<ul class="software-list">${software.map(item => `<li><a class="software-entry" href="${escape(item.href)}"><h3 class="recommendation-title">${escape(item.title)} <span class="software-arrow" aria-hidden="true">↗</span></h3><p>${escape(item.description)}</p></a></li>`).join('')}</ul>`;
}

export function recommendationSections({ escape }) {
  return `<section aria-labelledby="books"><h2 class="section-title" id="books">Books</h2><p class="section-intro">A few favorites from my bookshelf.</p>${bookList({ escape })}</section><section aria-labelledby="software"><h2 class="section-title" id="software">Software</h2><p class="section-intro">Tools and projects I like.</p>${softwareList({ escape })}</section>`;
}
