import React, { useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import FormInput from "../../components/form-input/form-input.component";

const CreatePartForm = () => {
  const params = useParams();
  let history = useHistory();
  const [partData, setPartData] = useState({
    uuid: params.uuid,
    name: "",
    brand: "",
    model: "",
    category: "",
    quantity: 0,
    price: 0.0,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    axios({
      method: "post",
      withCredentials: true,
      data: {
        name: partData.name,
        brand: partData.brand,
        model: partData.model,
        category: partData.category,
        quantity: partData.quantity,
        price: partData.price,
      },
      url: `http://localhost:5000/api/parts/`,
    })
      .then((res) => {
        console.log(res);
        alert(res.data);
        history.push("/");
      })
      .catch((err) => console.log(err));
  };

  const handleChange = (event) => {
    const { value, name } = event.target;
    setPartData({ ...partData, [name]: value });
  };

  return (
    <div className="part-create">
      <h1>Create New Part</h1>

      <form className="part-create-form" onSubmit={handleSubmit}>
        <FormInput
          name="name"
          type="text"
          value={partData.name}
          handleChange={handleChange}
          label="Name"
          required
        />

        <FormInput
          name="brand"
          type="text"
          value={partData.brand}
          handleChange={handleChange}
          label="Brand"
          required
        />

        <FormInput
          name="model"
          type="text"
          value={partData.model}
          handleChange={handleChange}
          label="Model"
          required
        />

        <FormInput
          name="category"
          type="text"
          value={partData.category}
          handleChange={handleChange}
          label="Category"
          required
        />

        <FormInput
          name="quantity"
          type="number"
          value={partData.quantity}
          handleChange={handleChange}
          label="Quantity"
          required
        />

        <FormInput
          name="price"
          type="number"
          step={0.1}
          value={partData.price}
          handleChange={handleChange}
          label="Price"
          required
        />

        <button type="submit"> CREATE PART </button>
      </form>
    </div>
  );
};

export default CreatePartForm;