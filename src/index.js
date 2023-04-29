const ui = {
   userName: document.getElementById("userName"),
   userImg: document.getElementById("userImg"),
   userCoins: document.getElementById("userCoin")
};

const loader = (visibility) =>
   (document.querySelector(".loader").style.display = visibility
      ? "flex"
      : "none");