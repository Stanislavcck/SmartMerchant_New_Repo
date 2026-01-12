using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;


namespace SmartMerchant.Application
{
    public interface IRepository<T> where T : class
    {
        T? GetById(object id);
        T? GetByProperty(string propertyName, object propertyValue);
        IEnumerable<T> GetAll();
        void Add(T entity);
        void Update(T entity);
        void Delete(T entity);
        void Detach(T? entity);
        IQueryable<T> Query();
    }

    public class Repository<T> : IRepository<T> where T : class
    {
        private readonly DatabaseContext _context;
        private readonly DbSet<T> _dbSet;

        public Repository(DatabaseContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public T? GetById(object id)
        {
            return _dbSet.Find(id);
        }

        public T? GetByProperty(string propertyName, object propertyValue)
        {
            return _dbSet.Aggregate((T?)null, (current, x) => EF.Property<object>(x, propertyName) == propertyValue ? x : current);
        }

        public IEnumerable<T> GetAll()
        {
            return _dbSet.ToList();
        }

        public void Add(T entity)
        {
            _dbSet.Add(entity);
        }

        public void Update(T entity)
        {
            _dbSet.Update(entity);
        }

        public void Delete(T entity)
        {
            _dbSet.Remove(entity);
        }

        public IQueryable<T> Query()
        {
            return _dbSet.AsQueryable().AsNoTracking();
        }

        public void Detach(T entity)
        {
            _context.Entry(entity).State = EntityState.Detached;
        }
    }

    public interface IUnitOfWork : IDisposable
    {
        IRepository<T> Repository<T>() where T : class;
        IDbContextTransaction BeginTranscation(IsolationLevel isolationLevel);
        bool IsTransactionActive { get; }
        void Commit();
        void Rollback();
        int SaveChanges();
    }

    public class UnitOfWork : IUnitOfWork
    {
        private readonly DatabaseContext _context;
        private readonly Dictionary<Type, object> _repositories = new();
        private IDbContextTransaction? _transaction;

        public UnitOfWork(DatabaseContext context)
        {
            _context = context;
        }

        public IDbContextTransaction BeginTranscation(IsolationLevel isolationLevel = IsolationLevel.RepeatableRead)
        {
            if (_transaction != null)
            {
                throw new InvalidOperationException("Transaction already started");
            }

            _transaction = _context.Database.BeginTransaction(isolationLevel);

            return _transaction;
        }

        public bool IsTransactionActive
        {
            get
            {
                return _transaction != null;
            }
        }

        public void Commit()
        {
            if (_transaction == null)
            {
                throw new InvalidOperationException("Transaction not started");
            }
            _transaction.Commit();
            _transaction.Dispose();
            _transaction = null;
        }

        public void Rollback()
        {
            if (_transaction == null)
            {
                throw new InvalidOperationException("Transaction not started");
            }

            _transaction.Rollback();
            _transaction.Dispose();
            _transaction = null;
        }

        public IRepository<T> Repository<T>() where T : class
        {
            if (!_repositories.ContainsKey(typeof(T)))
            {
                var repositoryInstance = new Repository<T>(_context);
                _repositories[typeof(T)] = repositoryInstance;
            }

            return (IRepository<T>)_repositories[typeof(T)];
        }

        public int SaveChanges()
        {
            return _context.SaveChanges();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
