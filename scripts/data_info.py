import pandas as pd
import yaml
import os
import hashlib

def generate_datacard(csv_path, output_path):
    # Read the CSV file
    df = pd.read_csv(csv_path)
    
    # Calculate statistics
    num_records = len(df)
    file_size = os.path.getsize(csv_path) / 1024  # in KB
    
    # Calculate checksum
    with open(csv_path, 'rb') as f:
        checksum = hashlib.md5(f.read()).hexdigest()
    
    # Create datacard
    datacard = {
        'num_records': num_records,
        'file_size_kb': round(file_size, 2),
        'checksum': checksum,
        'columns': list(df.columns)
    }
    
    # Write to YAML file
    with open(output_path, 'w') as f:
        yaml.dump(datacard, f, default_flow_style=False, allow_unicode=True)
    
    print(f"DataCard generated: {output_path}")
    print(f"Records: {num_records}")
    print(f"Size: {file_size:.2f} KB")
    print(f"Checksum: {checksum}")

if __name__ == "__main__":
    csv_path = "data/cert_texts.csv"
    output_path = "data/datacard.yaml"
    
    if os.path.exists(csv_path):
        generate_datacard(csv_path, output_path)
    else:
        print(f"Error: {csv_path} not found")
