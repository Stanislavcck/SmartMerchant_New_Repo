namespace SmartMerchant.Domain
{
    public class TransactionHistory : Entity
    {
        public Guid MerchantGuid { get; set; }
        public decimal Amount { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
