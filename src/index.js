import { refs } from './js/refs';
import fetchImages from './js/fetchImages';
import imageCardMarkup from './js/imageCardMarkup';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import throttle from 'lodash.throttle';

function createGalleryCard(gallery) {
  const markup = gallery.map(card => imageCardMarkup(card)).join('');
  refs.gallery.insertAdjacentHTML('beforeend', markup);
}

let lightbox = new SimpleLightbox('.photo-card a', {
  captions: true,
  captionsData: 'alt',
  captionPosition: 'bottom',
  captionDelay: 250,
});

let currentPage = 1;
let currentHits = 0;
let searchQuery = '';

refs.searchForm.addEventListener('submit', onSubmitForm);

async function onSubmitForm(e) {
  e.preventDefault();
  searchQuery = e.currentTarget.searchQuery.value;
  currentPage = 1;

  if (searchQuery === '') {
    return;
  }

  const response = await fetchImages(searchQuery, currentPage);
  currentHits = response.hits.length;

  if (response.totalHits > 40) {
    refs.loadMoreBtn.classList.remove('is-hidden');
  } else {
    refs.loadMoreBtn.classList.add('is-hidden');
  }

  try {
    if (response.totalHits > 0) {
      Notify.success(`Hooray! We found ${response.totalHits} images.`);
      refs.gallery.innerHTML = '';
      createGalleryCard(response.hits);
      lightbox.refresh();
      refs.endCollectionText.classList.add('is-hidden');
    }

    if (response.totalHits === 0) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      refs.gallery.innerHTML = '';
      refs.loadMoreBtn.classList.add('is-hidden');
      refs.endCollectionText.classList.add('is-hidden');
    }
  } catch (error) {
    console.log(error);
  }
}

refs.loadMoreBtn.addEventListener('click', onClickLoadMoreBtn);

async function onClickLoadMoreBtn() {
  currentPage += 1;
  const response = await fetchImages(searchQuery, currentPage);
  createGalleryCard(response.hits);
  lightbox.refresh();
  currentHits += response.hits.length;

  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });

  if (currentHits === response.totalHits) {
    refs.loadMoreBtn.classList.add('is-hidden');
    refs.endCollectionText.classList.remove('is-hidden');
  }
}

// Подгрузка контента при прокрутке - infinite scroll

// window.addEventListener('scroll', throttle(onScrollWindow, 500));

// async function onScrollWindow() {
//   const documentRect = document.documentElement.getBoundingClientRect();
//   const heightBeforeLoading = 300;
//   if (
//     documentRect.bottom <
//     document.documentElement.clientHeight + heightBeforeLoading
//   ) {
//     currentPage += 1;
//     const response = await fetchImages(searchQuery, currentPage);
//     createGalleryCard(response.hits);
//     lightbox.refresh();
//     currentHits += response.hits.length;

//     if (currentHits === response.totalHits) {
//       endCollectionText.classList.remove('is-hidden');
//     }
//   }
// }
