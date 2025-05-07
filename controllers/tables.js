const { shopTableSchema } = require("../models/table");

async function create_table_section(req, res) {
  const body = req.body;
  try {
    const existingShopTable = await shopTableSchema.findOne({
      shopID: body?.authUser?._id,
    });
    if (!existingShopTable) {
      const newShopTable = new shopTableSchema({
        shopID: body?.authUser?._id,
        tableTypes: [
          {
            tableTypeName: body?.sectionName,
          },
        ],
      });
      await newShopTable.save();
    } else {
      existingShopTable.tableTypes.push({ tableTypeName: body?.sectionName });
      await existingShopTable.save();
    }
    return res.status(200).json({ msg: "Section Added" });
  } catch (error) {
    return res.status(400).json({ msg: "Somthing Went Wrong" });
  }
}

async function add_table(req, res) {
  const body = req.body;

  try {
    const existingShopTable = await shopTableSchema.findOne({
      shopID: body?.authUser?._id,
    });
    if (!existingShopTable) {
      return res.status(400).json({ msg: "Pls Create Table Type" });
    } else {
      const existingTableTypeIndex = existingShopTable?.tables?.findIndex(
        (table) => table.table_type_id === body?.table_type_id
      );
      if (existingTableTypeIndex !== -1) {
        existingShopTable.tables[existingTableTypeIndex].table_data.push({
          name: body?.table_name,
          total: 0,
          orderID: null,
        });
      } else {
        existingShopTable.tables.push({
          table_type: body?.table_type,
          table_type_id: body?.table_type_id,
          table_data: {
            name: body?.table_name,
            total: 0,
            orderID: null,
          },
        });
      }
      await existingShopTable.save();
    }
    return res.status(200).json({ msg: "Table Added" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_sections(req, res) {
  const body = req.body;
  try {
    const existingTable = await shopTableSchema.findOne({
      shopID: body?.authUser?._id,
    });
    if (!existingTable) {
      return res.status(200).json({ msg: "pls add section before Table" });
    }
    return res
      .status(200)
      .json({ msg: "Table Sections", target: existingTable?.tableTypes });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}
async function get_tables(req, res) {
  const body = req.body;
  try {
    const existingTable = await shopTableSchema.findOne({
      shopID: body?.authUser?._id,
    });
    if (!existingTable) {
      return res.status(200).json({ msg: "No Table Exist" });
    }
    return res
      .status(200)
      .json({ msg: "Tables", target: existingTable?.tables });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function change_status_of_table(req, res) {
  const body = req.body;
  try {
    const update = {
      $set: {
        "tables.$[t].table_data.$[i].workingTable": body?.workingTable,
      },
    };
    const arrayFilters = [
      { "t.table_type_id": body?.table_type_id },
      { "i._id": body?.tableID },
    ];
    await shopTableSchema.updateOne(
      {
        shopID: body?.authUser?._id,
      },
      update,
      {
        arrayFilters,
      }
    );
    return res.status(200).json({ msg: "Table Status Updated" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function delete_table(req, res) {
  const body = req.body;
  try {
    const existingTable = await shopTableSchema.findOne({ shopID: body?.authUser?._id });
    
    if (!existingTable) {
      return res.status(404).json({ msg: "Table not found" });
    }

    const table_type_index = existingTable.tables.findIndex((data) =>
      String(data.table_type_id) === String(body?.table_type_id)
    );

    if (table_type_index === -1) {
      return res.status(404).json({ msg: "Table type not found" });
    }

    const tableDataIndex = existingTable.tables[table_type_index].table_data.findIndex((data) =>
      String(data._id) === String(body?.tableID)
    );

    if (tableDataIndex !== -1) {
      if(tableDataIndex === 0 && existingTable?.tables[table_type_index]?.table_data?.length === 1){
        existingTable.tables.splice(table_type_index, 1);
        const type_index = existingTable?.tableTypes.findIndex((data) => String(data?._id) === String(body?.table_type_id));
        existingTable.tableTypes.splice(type_index, 1);
      }else{
        existingTable.tables[table_type_index].table_data.splice(tableDataIndex, 1);
      }
      await existingTable.save();
      return res.status(200).json({ msg: "Table Deleted" });
    } else {
      return res.status(404).json({ msg: "Table data not found" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
  get_sections,
  create_table_section,
  add_table,
  get_tables,
  change_status_of_table,
  delete_table,
};
