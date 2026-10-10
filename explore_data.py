
import pandas as pd

# Load the dataset
df = pd.read_csv("data/student-mat.csv", sep=";")

# Display the first five rows
print(df.head())

# Display the number of rows and columns
print("\nDataset shape:")
print(df.shape)

# Display column names
print("\nColumns:")
print(df.columns.tolist())

# Check for missing values
print("\nMissing values:")
print(df.isnull().sum())

# Show basic statistics
print("\nSummary:")
print(df.describe())