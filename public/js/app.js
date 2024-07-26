document.addEventListener('DOMContentLoaded', async function() {
  const productList = document.getElementById('product-list');
  const cartList = document.getElementById('cart-list');
  const checkoutBtn = document.getElementById('checkout-btn');
  const adminControls = document.getElementById('admin-controls');
  let cart = [];

  // Verificar si el usuario es administrador
  try {
    const response = await fetch('/api/check-auth');
    const result = await response.json();
    if (result.isAuthenticated) {
      if (result.isAdmin) {
        adminControls.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
  }

  // Función para cargar productos
  async function loadProducts() {
    try {
      const response = await fetch('/api/products');
      const products = await response.json();
      productList.innerHTML = '';
      products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('col-md-4');
        productItem.innerHTML = `
          <div class="card mb-4">
            <img src="${product.image}" class="card-img-top" alt="${product.name}">
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">$${product.promotion || product.price}</p>
              <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">Añadir al carrito</button>
            </div>
          </div>
        `;
        productList.appendChild(productItem);
      });

      document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', addToCart);
      });
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  }

  // Función para añadir productos al carrito
  function addToCart(event) {
    const productId = event.target.getAttribute('data-id');
    const productName = event.target.parentElement.querySelector('.card-title').textContent;
    const productPrice = event.target.parentElement.querySelector('.card-text').textContent;

    const cartItem = {
      id: productId,
      name: productName,
      price: productPrice
    };

    cart.push(cartItem);
    displayCart();
  }

  // Función para mostrar el carrito
  function displayCart() {
    cartList.innerHTML = '';
    cart.forEach(item => {
      const cartItem = document.createElement('li');
      cartItem.classList.add('list-group-item');
      cartItem.textContent = `${item.name} - ${item.price}`;
      cartList.appendChild(cartItem);
    });
  }

  // Función para finalizar la compra
  checkoutBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: cart })
      });
      const result = await response.json();
      alert(result.message);
      cart = [];
      displayCart();
    } catch (error) {
      console.error('Error al finalizar la compra:', error);
    }
  });

  // Cargar productos al inicio
  loadProducts();
});
