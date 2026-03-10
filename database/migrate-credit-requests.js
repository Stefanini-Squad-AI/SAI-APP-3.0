// Migration script to convert field names from PascalCase to camelCase
// and convert string values to proper numeric types

db.creditRequests.find().forEach(function(doc) {
  db.creditRequests.updateOne(
    { _id: doc._id },
    {
      $set: {
        createdAt: doc.CreatedAt || doc.createdAt,
        updatedAt: doc.UpdatedAt || doc.updatedAt,
        deletedAt: doc.DeletedAt || doc.deletedAt,
        fullName: doc.FullName || doc.fullName,
        identificationNumber: doc.IdentificationNumber || doc.identificationNumber,
        email: doc.Email || doc.email,
        phone: doc.Phone || doc.phone,
        address: doc.Address || doc.address,
        employmentStatus: doc.EmploymentStatus || doc.employmentStatus,
        monthlySalary: parseFloat(doc.MonthlySalary || doc.monthlySalary || 0),
        yearsOfEmployment: doc.YearsOfEmployment || doc.yearsOfEmployment,
        creditType: doc.CreditType || doc.creditType,
        useOfMoney: doc.UseOfMoney || doc.useOfMoney,
        requestedAmount: parseFloat(doc.RequestedAmount || doc.requestedAmount || 0),
        termYears: doc.TermYears || doc.termYears,
        interestRate: parseFloat(doc.InterestRate || doc.interestRate || 0),
        monthlyPayment: parseFloat(doc.MonthlyPayment || doc.monthlyPayment || 0),
        totalPayment: parseFloat(doc.TotalPayment || doc.totalPayment || 0),
        totalInterest: parseFloat(doc.TotalInterest || doc.totalInterest || 0),
        status: doc.Status || doc.status,
        requestDate: doc.RequestDate || doc.requestDate
      },
      $unset: {
        CreatedAt: "",
        UpdatedAt: "",
        DeletedAt: "",
        FullName: "",
        IdentificationNumber: "",
        Email: "",
        Phone: "",
        Address: "",
        EmploymentStatus: "",
        MonthlySalary: "",
        YearsOfEmployment: "",
        CreditType: "",
        UseOfMoney: "",
        RequestedAmount: "",
        TermYears: "",
        InterestRate: "",
        MonthlyPayment: "",
        TotalPayment: "",
        TotalInterest: "",
        Status: "",
        RequestDate: "",
        ReviewDate: "",
        ReviewNotes: ""
      }
    }
  );
});

print("Migration completed!");
