import React, { useState, useEffect } from 'react';
import { productService } from '../../services';
import { EmptyState, ConfirmModal } from '../../components/common/UI';
import { toast } from 'react-toastify';

const CATEGORIES = [
    'Silk Sarees', 'Cotton Sarees', 'Banarasi Sarees', 'Kanjivaram Sarees',
    'Chanderi Sarees', 'Handloom Sarees', 'Designer Sarees', 'Handcrafted Jewelry',
    'Handcrafted Bags', 'Home Decor', 'Other',
];

const defaultForm = {
    name: '', description: '', price: '', discountPrice: '', stock: '', category: 'Silk Sarees',
    material: '', weight: '',
    handmadeDetails: { craftType: '', region: '', artisan: '', timeTaken: '' },
};

const VendorProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [imageUrls, setImageUrls] = useState(['']);
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, id: null });

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await productService.getMyProducts({ limit: 50 });
            setProducts(data.data);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openNew = () => { setForm(defaultForm); setImageUrls(['']); setEditProduct(null); setShowForm(true); };
    const openEdit = (p) => {
        setForm({
            name: p.name, description: p.description, price: p.price,
            discountPrice: p.discountPrice || '', stock: p.stock,
            category: p.category, material: p.material || '', weight: p.weight || '',
            handmadeDetails: p.handmadeDetails || defaultForm.handmadeDetails,
        });
        setImageUrls(p.images?.map((i) => i.url) || ['']);
        setEditProduct(p);
        setShowForm(true);
    };

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const handleHandmadeChange = (e) => setForm((f) => ({ ...f, handmadeDetails: { ...f.handmadeDetails, [e.target.name]: e.target.value } }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                price: Number(form.price),
                discountPrice: Number(form.discountPrice) || 0,
                stock: Number(form.stock),
                images: imageUrls.filter(Boolean).map((url) => ({ url, altText: form.name })),
            };
            if (editProduct) {
                await productService.updateProduct(editProduct._id, payload);
                toast.success('Product updated!');
            } else {
                await productService.createProduct(payload);
                toast.success('Product created!');
            }
            setShowForm(false);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await productService.deleteProduct(confirm.id);
            toast.success('Product deleted.');
            setConfirm({ open: false, id: null });
            load();
        } catch {
            toast.error('Failed to delete product.');
        }
    };

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Products</h1>
                <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Product</button>
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /></div>
            ) : products.length === 0 ? (
                <EmptyState icon="🧵" title="No products yet" message="Add your first handmade product!" action={<button className="btn btn-primary" onClick={openNew}>Add Product</button>} />
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sales</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <img src={p.images?.[0]?.url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.name}</span>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-primary">{p.category}</span></td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{p.price.toLocaleString('en-IN')}</span>
                                        {p.discountPrice > 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginLeft: 4, textDecoration: 'line-through' }}>₹{p.discountPrice}</span>}
                                    </td>
                                    <td><span style={{ color: p.stock > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{p.stock > 0 ? p.stock : 'OOS'}</span></td>
                                    <td>{p.totalSold || 0}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ open: true, id: p._id })}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Product Name *</label>
                                    <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Description *</label>
                                    <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price (₹) *</label>
                                    <input type="number" name="price" className="form-control" value={form.price} onChange={handleChange} required min={1} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Discount Price (₹)</label>
                                    <input type="number" name="discountPrice" className="form-control" value={form.discountPrice} onChange={handleChange} min={0} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Stock *</label>
                                    <input type="number" name="stock" className="form-control" value={form.stock} onChange={handleChange} required min={0} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category *</label>
                                    <select name="category" className="form-control" value={form.category} onChange={handleChange}>
                                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Material</label>
                                    <input name="material" className="form-control" value={form.material} onChange={handleChange} placeholder="e.g., Pure Silk, Cotton" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Craft Type</label>
                                    <input name="craftType" className="form-control" value={form.handmadeDetails.craftType} onChange={handleHandmadeChange} placeholder="e.g., Handwoven" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Region of Craft</label>
                                    <input name="region" className="form-control" value={form.handmadeDetails.region} onChange={handleHandmadeChange} placeholder="e.g., Varanasi, UP" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Artisan Name</label>
                                    <input name="artisan" className="form-control" value={form.handmadeDetails.artisan} onChange={handleHandmadeChange} />
                                </div>
                            </div>
                            {/* Image URLs */}
                            <div className="form-group" style={{ marginTop: 4 }}>
                                <label className="form-label">Image URLs</label>
                                {imageUrls.map((url, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <input className="form-control" value={url} onChange={(e) => { const arr = [...imageUrls]; arr[idx] = e.target.value; setImageUrls(arr); }} placeholder="https://..." />
                                        {imageUrls.length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}>✕</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImageUrls([...imageUrls, ''])}>+ Add Image</button>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={confirm.open}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setConfirm({ open: false, id: null })}
                danger
            />
        </div>
    );
};

export default VendorProducts;
