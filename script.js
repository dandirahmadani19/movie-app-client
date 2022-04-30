const BASE_URL = "http://localhost:10000";
let currentAuthorId, currentAuthorRole;
$(document).ready(() => {
  setDateToFooterForm();
  hideLoading();
  showGenreToFormAddAndUpdateMovie();
  gapi.signin2.render("my-signin2", {
    scope: "profile email",
    width: 350,
    height: 50,
    longtitle: true,
    theme: "dark",
    onsuccess: onSuccess,
    onfailure: onFailure,
  });
  if (localStorage.getItem("access_token")) {
    isLogin();
  } else {
    isNotLogin();
  }

  $("#form-login").on("submit", postLogin);
  $("#form-register").on("submit", postRegister);
  $("#btn-submit-add-movie").click(addMovie);
  $(".btn-close-modal-add-movie").on("click", clearInputAddModal);
  $("#modal-update-movie").on("show.bs.modal", showFormUpdateMovie);
  $("#btn-submit-update-movie").click(updateMovie);
  // $(".btn-close-modal-update-movie").on("click", clearInputUpdateModal);
  $("#modal-delete-movie").on("show.bs.modal", showModalDelete);
  $("#modal-watch-trailer-movie").on("shown.bs.modal", playTrailerMovie);
  $("#modal-watch-trailer-movie").on("hide.bs.modal", stopTrailerMovie);
});
function postLogin(event) {
  event.preventDefault();
  showLoading();
  const { email, password } = takeValueOfInput("login");

  $.ajax({
    url: BASE_URL + "/users/login",
    method: "POST",
    data: {
      email,
      password,
    },
  })
    .done((data) => {
      localStorage.setItem("access_token", data.access_token);
      isLogin();
    })
    .fail((err) => {
      console.log(err);
      const message = err.responseJSON.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
      });
    })
    .always(function () {
      hideLoading();
      clearInput("login");
    });
}
function postRegister(event) {
  event.preventDefault();
  const { email, password } = takeValueOfInput("register");
  showLoading();
  $.ajax({
    url: BASE_URL + "/users/register",
    method: "POST",
    data: {
      email,
      password,
    },
  })
    .done((newUser) => {
      showLogin();
      Swal.fire(
        "Success!",
        "You have successfully registered!\n Please, login first! ",
        "Ok"
      );
    })
    .fail((err) => {
      console.log(err);
      const message = err.responseJSON.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
      });
    })
    .always(() => {
      clearInput("register");
      hideLoading();
    });
}
function onSuccess(googleUser) {
  const id_token = googleUser.getAuthResponse().id_token;
  showLoading();
  $.ajax({
    url: BASE_URL + "/users/login-google",
    method: "POST",
    data: {
      token: id_token,
    },
  })
    .done((data) => {
      localStorage.setItem("access_token", data.access_token);
      $("#table-movies").empty();
      isLogin();
    })
    .fail((err) => {
      const message = err.responseJSON.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
      });
    })
    .always(() => {
      hideLoading();
    });
}
function onFailure(error) {
  console.log(error);
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: "Failed to login using google account",
  });
}
function signOut() {
  if (currentAuthorRole === "staff") {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      localStorage.removeItem("access_token");
      $("#table-movies").empty();
      isNotLogin();
    });
  } else {
    localStorage.removeItem("access_token");
    $("#table-movies").empty();
    isNotLogin();
  }
}
function showAuthorProfile() {
  $.ajax({
    url: BASE_URL + "/users/detail-profile",
    method: "GET",
    headers: {
      access_token: localStorage.getItem("access_token"),
    },
  })
    .done((user) => {
      currentAuthorId = user.data.id;
      currentAuthorRole = user.data.role;
      const { email, role } = user.data;
      $("#email-profile").text(email);
      $("#role-profile").text(role);
      $("#greetings").text(`Hello, ${email}`);
    })
    .fail((err) => {
      console.log(err);
      data = err.responseJSON;
    });
}
function showMovies() {
  $.ajax({
    url: BASE_URL + "/movies",
    method: "GET",
    headers: {
      access_token: localStorage.getItem("access_token"),
    },
  })
    .done((movies) => {
      if (movies.data.length) {
        $("#table-movies").append(`
                  <thead>
                      <tr>
                          <th>No.</th>
                          <th>Image</th>
                          <th>Title</th>
                          <th>Author</th>
                          <th>Trailer URL</th>
                          <th>Genre</th>
                          <th>Rating</th>
                          <th>Action</th>
                      </tr>
                  </thead>
                  <tbody id="table-movies-body">
                  </tbody>
              `);

        movies.data.forEach((e, i) => {
          $("#table-movies-body").append(`
                      <tr>
                          <td>${i + 1}</td>
                          <td><img src="${e.imgUrl}" id="img-movie"/></td>
                          <td>${e.title}</td>
                          <td>${e.User.email}</td>
                          <td>
                            <button class="btn btn-sm btn-secondary btn-watch-trailer-movie" 
                            data-bs-toggle="modal" data-movie-src="${
                              e.trailerUrl
                            }" 
                            data-bs-target="#modal-watch-trailer-movie">Watch Trailer
                            </button>
                          </td>
                          <td>${e.Genre.name}</td>
                          <td>${e.rating}</td>
                          <td id="btn-action-movie-${i}"></td>
                      </tr> 
                  `);
        });
        showButtonActionMovie(movies.data);
      } else {
        $("#card-body").append(`<h3>Movie is not exist.</h3>`);
      }
    })
    .fail((err) => {
      console.log(err);
    });
}
function showButtonActionMovie(movies) {
  movies.forEach((e, i) => {
    const buttons = `
      <button class="btn btn-sm btn-success mb-2 w-100" id="btn-movie-update" 
      data-bs-toggle="modal" data-bs-target="#modal-update-movie" data-movie-id="${e.id}">Update</button>
      <br>
      <button class="btn btn-sm btn-danger w-100" id="btn-movie-delete" 
      data-bs-toggle="modal" data-bs-target="#modal-delete-movie" 
      data-movie-title="${e.title}" data-movie-id="${e.id}">Delete</button>
    `;
    if (currentAuthorRole === "admin") {
      $(`#btn-action-movie-${i}`).append(buttons);
    } else {
      if (currentAuthorId === e.authorId) {
        $(`#btn-action-movie-${i}`).append(buttons);
      }
    }
  });
}
function showGenreToFormAddAndUpdateMovie() {
  $.ajax({
    url: BASE_URL + "/genres",
    method: "GET",
    headers: {
      access_token: localStorage.getItem("access_token"),
    },
  })
    .done((genres) => {
      genres.data.forEach((e) => {
        $("#genreId-add-movie").append(
          `<option value="${e.id}">${e.name}</option>`
        );
      });
      genres.data.forEach((e) => {
        $("#genreId-update-movie").append(
          `<option value="${e.id}">${e.name}</option>`
        );
      });
    })
    .fail((err) => {
      console.log(err);
    });
}
function addMovie(e) {
  e.preventDefault();
  const { title, synopsis, trailerUrl, imgUrl, rating, genreId } =
    takeValueFromFormAddMovie();
  showLoading();
  $.ajax({
    url: BASE_URL + "/movies/add",
    method: "POST",
    headers: {
      access_token: localStorage.getItem("access_token"),
    },
    data: {
      title,
      synopsis,
      trailerUrl,
      imgUrl,
      rating,
      genreId,
      authorId: currentAuthorId,
    },
  })
    .done((newMovie) => {
      $("#table-movies").empty();
      showMovies();
      Swal.fire("Success!", newMovie.message, "Ok");
    })
    .fail((err) => {
      console.log(err);
      const message = err.responseJSON.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
      });
    })
    .always(() => {
      $("#modal-add-movie").modal("hide");
      clearInputAddModal();
      hideLoading();
    });
}
function showFormUpdateMovie(e) {
  const id = $(e.relatedTarget).data("movie-id");
  $.ajax({
    url: BASE_URL + `/movies/${id}`,
    method: "GET",
    headers: {
      access_token: localStorage.getItem("access_token"),
    },
  })
    .done((movie) => {
      const { id, title, synopsis, trailerUrl, imgUrl, rating, genreId } =
        movie.data;
      $("#id-update-movie").val(id);
      $("#title-update-movie").val(title);
      $("#trailerUrl-update-movie").val(trailerUrl);
      $("#imgUrl-update-movie").val(imgUrl);
      $("#rating-update-movie").val(rating);
      $("#synopsis-update-movie").val(synopsis);
      $(`#genreId-update-movie option[value="${genreId}"]`).prop(
        "selected",
        true
      );
    })
    .fail((err) => {
      console.log(err);
    });
}
function updateMovie(e) {
  e.preventDefault();
  const { id, title, synopsis, trailerUrl, imgUrl, rating, genreId } =
    takeValueFromFormUpdateMovie();
  showLoading();
  $.ajax({
    url: BASE_URL + `/movies/update/${+id}`,
    method: "PUT",
    headers: {
      access_token: localStorage.getItem("access_token"),
    },
    data: {
      title,
      synopsis,
      trailerUrl,
      imgUrl,
      rating,
      genreId,
    },
  })
    .done((movie) => {
      $("#table-movies").empty();
      showMovies();
      Swal.fire("Success!", movie.message, "Ok");
    })
    .fail((err) => {
      console.log(err);
      const message = err.responseJSON.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
      });
    })
    .always(() => {
      $("#modal-update-movie").modal("hide");
      clearInputAddModal();
      hideLoading();
    });
}
function showModalDelete(e) {
  const title = $(e.relatedTarget).data("movie-title");
  const id = $(e.relatedTarget).data("movie-id");
  $("#modal-body-delete-movie").html(
    `Are you sure to delete <strong>"${title}"</strong> ?`
  );
  $("#btn-modal-delete-movie").click((e) => {
    deleteMovie(id);
  });
}
function deleteMovie(movieId) {
  showLoading();
  $.ajax({
    url: BASE_URL + `/movies/delete/${+movieId}`,
    method: "GET",
    headers: {
      access_token: localStorage.getItem("access_token"),
    },
  })
    .done((response) => {
      $("#table-movies").empty();
      showMovies();
      Swal.fire("Success!", response.message, "Ok");
    })
    .fail((err) => {
      console.log(err);
      const message = err.responseJSON.message;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
      });
    })
    .always(() => {
      $("#modal-delete-movie").modal("hide");
      hideLoading();
    });
}
function isNotLogin() {
  $("#content-form-login").show();
  $("#content-form-register").hide();
  $("#app").hide();
}
function isLogin() {
  $("#content-form-login").hide();
  $("#content-form-register").hide();
  $("#app").show();
  showAuthorProfile();
  showMovies();
}
function showRegister() {
  $("#content-form-register").show();
  $("#content-form-login").hide();
}
function showLogin() {
  $("#content-form-register").hide();
  $("#content-form-login").show();
}
function takeValueOfInput(form) {
  const email = $(`#email-${form}`).val();
  const password = $(`#password-${form}`).val();
  return { email, password };
}
function clearInput(form) {
  $(`#email-${form}`).val("");
  $(`#password-${form}`).val("");
}
function showLoading() {
  $("#loading-section").css("width", "100%");
  $("#loading-section").css("height", "100%");
}
function hideLoading() {
  $("#loading-section").css("width", 0);
  $("#loading-section").css("height", 0);
}
function takeValueFromFormAddMovie() {
  const title = $("#title-add-movie").val();
  const synopsis = $("#synopsis-add-movie").val();
  const trailerUrl = $("#trailerUrl-add-movie").val();
  const imgUrl = $("#imgUrl-add-movie").val();
  const rating = $("#rating-add-movie").val();
  const genreId = $("#genreId-add-movie").val();

  return { title, synopsis, trailerUrl, imgUrl, rating, genreId };
}
function takeValueFromFormUpdateMovie() {
  const id = $("#id-update-movie").val();
  const title = $("#title-update-movie").val();
  const synopsis = $("#synopsis-update-movie").val();
  const trailerUrl = $("#trailerUrl-update-movie").val();
  const imgUrl = $("#imgUrl-update-movie").val();
  const rating = $("#rating-update-movie").val();
  const genreId = $("#genreId-update-movie").val();

  return { id, title, synopsis, trailerUrl, imgUrl, rating, genreId };
}
function clearInputAddModal() {
  $("#title-add-movie").val("");
  $("#synopsis-add-movie").val("");
  $("#trailerUrl-add-movie").val("");
  $("#imgUrl-add-movie").val("");
  $("#rating-add-movie").val("");
  $("#genreId-add-movie option:first-child").prop("selected", "selected");
}
function clearInputUpdateModal() {
  $("#title-update-movie").val("");
  $("#synopsis-update-movie").val("");
  $("#trailerUrl-update-movie").val("");
  $("#imgUrl-update-movie").val("");
  $("#rating-update-movie").val("");
  $("#genreId-update-movie option:first-child").prop("selected", "selected");
}
function playTrailerMovie(e) {
  const src = $(e.relatedTarget).data("movie-src");
  $("#video-modal-watch-trailer-movie").attr(
    "src",
    `${src}?autoplay=1&amp;modestbranding=1&amp;showinfo=0`
  );
}
function stopTrailerMovie() {
  $("#video-modal-watch-trailer-movie").attr("src", null);
}
function setDateToFooterForm() {
  const year = new Date().getFullYear();
  $("#date").text(year);
}
