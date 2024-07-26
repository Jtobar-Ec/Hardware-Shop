document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    const addProductForm = document.getElementById('addProductForm');
    const deleteProductSection = document.getElementById('deleteProductSection');
    const productList = document.getElementById('productList');
    const addPromotionForm = document.getElementById('addPromotionForm');

    // Mostrar productos y configuraciones iniciales
    fetchProducts();

    // Configuración del botón de cerrar sesión
    logoutButton.addEventListener('click', () => {
        fetch('/api/logout', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Sesión cerrada con éxito') {
                    window.location.href = '/login'; // Redirigir al login
                }
            });
    });

    // Agregar producto
    addProductForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(addProductForm);
        const data = Object.fromEntries(formData.entries());

        fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchProducts(); // Actualizar la lista de productos
        });
    });

    // Eliminar producto
    function fetchProducts() {
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                productList.innerHTML = '';
                products.forEach(product => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${product.name} - $${product.price}`;
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Eliminar';
                    deleteButton.addEventListener('click', () => {
                        fetch(`/api/products/${product.id}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                                alert(data.message);
                                fetchProducts(); // Actualizar la lista de productos
                            });
                    });
                    listItem.appendChild(deleteButton);
                    productList.appendChild(listItem);
                });
            });
    }

    // Agregar promoción
    addPromotionForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(addPromotionForm);
        const data = Object.fromEntries(formData.entries());

        fetch('/api/products/' + data.productId)
            .then(response => response.json())
            .then(product => {
                const originalPrice = product.price;
                const discount = parseFloat(data.promotionText);
                const newPrice = originalPrice - discount;

                return fetch('/api/products/' + data.productId, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ price: newPrice })
                });
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                fetchProducts(); // Actualizar la lista de productos
            });
    });
});
