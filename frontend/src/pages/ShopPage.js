import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services';
import ProductCard from '../components/common/ProductCard';
import { PageLoader, EmptyState } from '../components/common/UI';

const CATEGORIES = [
    'All', 'Silk Sarees', 'Cotton Sarees', 'Banarasi Sarees',
    'Kanjivaram Sarees', 'Chanderi Sarees', 'Handloom Sarees',
    'Designer Sarees', 'Handcrafted Jewelry', 'Handcrafted Bags',
    'Home Decor', 'Other',
];

const SORT_OPTIONS = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-ratings.average', label: 'Top Rated' },
    { value: '-totalSold', label: 'Best Selling' },
];

const ShopPage = () => {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);

    // localSearch is the live input value (no API call yet)
    const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
    const searchDebounceRef = useRef(null);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sort: searchParams.get('sort') || '-createdAt',
        page: 1,
    });

    // Debounce search: only update filters.search 500ms after user stops typing
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalSearch(value);
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: value, page: 1 }));
        }, 500);
    };

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => clearTimeout(searchDebounceRef.current);
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            if (!params.category) delete params.category;
            if (!params.search) delete params.search;
            if (!params.minPrice) delete params.minPrice;
            if (!params.maxPrice) delete params.maxPrice;
            const { data } = await productService.getProducts(params);
            setProducts(data.data);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    return (
        <div>
            <div className="page-header">
                <h1>Shop Handmade Treasures</h1>
                <p>Discover authentic sarees & crafts from Indian artisans</p>
            </div>

            <div className="page-content">
                <div className="shop-layout">
                    {/* ── FILTERS SIDEBAR ── */}
                    <aside className="filter-sidebar">
                        <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 24, fontSize: '1.1rem' }}>
                            🔍 Filters
                        </h3>

                        {/* Search */}
                        <div className="filter-section">
                            <h4>Search</h4>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search sarees, crafts..."
                                value={localSearch}
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Categories */}
                        <div className="filter-section">
                            <h4>Category</h4>
                            <div className="filter-chip-list">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        className={`filter-chip ${(cat === 'All' ? !filters.category : filters.category === cat) ? 'active' : ''}`}
                                        onClick={() => updateFilter('category', cat === 'All' ? '' : cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="filter-section">
                            <h4>Price Range (₹)</h4>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Min"
                                    value={filters.minPrice}
                                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                                    style={{ padding: '8px 10px' }}
                                />
                                <span style={{ color: 'var(--text-light)' }}>–</span>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                                    style={{ padding: '8px 10px' }}
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="filter-section">
                            <h4>Sort By</h4>
                            {SORT_OPTIONS.map((opt) => (
                                <label
                                    key={opt.value}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                                        cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="sort"
                                        value={opt.value}
                                        checked={filters.sort === opt.value}
                                        onChange={(e) => updateFilter('sort', e.target.value)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>

                        <button
                            className="btn btn-secondary btn-full btn-sm"
                            onClick={() => {
                                setLocalSearch('');
                                clearTimeout(searchDebounceRef.current);
                                setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1 });
                            }}
                        >
                            Clear All Filters
                        </button>
                    </aside>

                    {/* ── PRODUCTS GRID ── */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                {pagination.totalItems || 0} products found
                            </p>
                        </div>

                        {loading ? (
                            <PageLoader />
                        ) : products.length === 0 ? (
                            <EmptyState
                                icon="🧵"
                                title="No products found"
                                message="Try adjusting your filters or search term."
                            />
                        ) : (
                            <>
                                <div className="products-grid">
                                    {products.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            className="page-btn"
                                            disabled={!pagination.hasPrevPage}
                                            onClick={() => updateFilter('page', filters.page - 1)}
                                        >
                                            ←
                                        </button>
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                                            <button
                                                key={p}
                                                className={`page-btn ${p === filters.page ? 'active' : ''}`}
                                                onClick={() => updateFilter('page', p)}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            className="page-btn"
                                            disabled={!pagination.hasNextPage}
                                            onClick={() => updateFilter('page', filters.page + 1)}
                                        >
                                            →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopPage;
